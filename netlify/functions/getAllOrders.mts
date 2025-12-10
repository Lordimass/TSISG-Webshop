import {Context} from '@netlify/functions';
import {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseClient from "../lib/getSupabaseClient.ts";
import type {CompressedOrder, MergedOrder} from '@shared/types/supabaseTypes.ts';
import type {RmOrder} from '@shared/types/royalMailTypes.ts';
import {NetlifyFunctionError} from "@shared/errors.ts";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";

/**
 * Compiles and returns merged order objects containing data from both Supabase and Royal Mail.
 */
export default async function handler(request: Request, _context: Context) {
    try {
        // Check that Supabase JWT auth is present in headers.
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            return new Response(undefined, {status: 403})
        }

        // Check that Royal Mail auth is present in env variables.
        if (!process.env.ROYAL_MAIL_KEY) {
            return new Response("ROYAL_MAIL_KEY not found in environment variables", {status: 403})
        }

        // Get Supabase client associated with the provided JWT token.
        let supabase: SupabaseClient
        try {
            supabase = await getSupabaseClient(authHeader);
        } catch (e: any) {
            return new Response(e.message, {status: e.status ?? 500})
        }

        // Fetch all orders from Supabase
        const supabaseOrders = await fetchCompressedOrders(supabase!)

        // Fetch all orders from Royal Mail
        // We want to fetch all orders placed between today and the
        // date of the oldest unfulfilled Supabase Order.
        const startDate = getEarliestUnfulfilledOrderDate(supabaseOrders)
        const rmOrders = await fetchRoyalMailOrders(startDate)

        // Merge Supabase and RM orders together to create objects which contain both sets of data.
        const mergedOrders: MergedOrder[] = mergeOrders(supabaseOrders, rmOrders)

        console.log(`Returning ${mergedOrders.length} orders from getAllOrders`)
        return new Response(JSON.stringify(mergedOrders), {
            status: 200,
            headers: {'Content-Type': 'application/json'},
        });

    } catch (error: any) {
        console.error(error);
        if (VALIDATORS.NetlifyFunctionError(error)) {
            error = error as NetlifyFunctionError;
            return new Response(error.message, {status: error.status})
        }
        return new Response(JSON.stringify(error), {status: 500})
    }
};

/**
 * Fetch all orders from the `compressed_orders` view table on Supabase.
 * @param supabase The supabsae object to use to fetch this data.
 * @returns A list of `CompressedOrder` objects
 */
async function fetchCompressedOrders(supabase: SupabaseClient) {
    const {data, error} = await supabase.from("orders_compressed").select("*")
    if (error) {
        throw new NetlifyFunctionError(JSON.stringify(error.message), 500);
    } else if (VALIDATORS.CompressedOrder(data[0])) {
        console.warn("Fetched orders not in expected shape 'CompressedOrder'")
        console.log(JSON.stringify(data[0], null, 2))
        logValidationErrors("CompressedOrder");
    }
    return data as CompressedOrder[];
}

/**
 * Fetch all orders after some given date from Royal Mail
 * @param start The start date to return all orders afterwards.
 * @returns An array of `RmOrder`s
 */
async function fetchRoyalMailOrders(start: Date) {
    const key = process.env.ROYAL_MAIL_KEY!

    // Construct URL for RM API requests.
    const url = new URL("https://api.parcel.royalmail.com/api/v1/orders")
    url.searchParams.set("startDateTime", start.toISOString());

    // Royal Mail paginates the result if its over 25 orders
    // so we need to combine them all.
    let orders: RmOrder[] = []
    let continuationToken: string | null = null
    while (continuationToken != "COMPLETED") {
        if (continuationToken) url.searchParams.set("continuationToken", continuationToken);
        const response: Response = await fetch(url, {headers: {Authorization: `Bearer ${key}`}})
        const data = await response.json()
        if (response.ok) {
            continuationToken = data.continuationToken ? data.continuationToken : "COMPLETED"
            orders = [...orders, ...data.orders]
        } else {
            console.error(data)
            throw new NetlifyFunctionError(data.message, 503)
        }
    }
    return orders;
}

/**
 * Fetch the date of the oldest unfulfilled order from a given list of orders
 * @param supabseOrders An array of `CompressedOrder`s
 * @returns A date object representing the date of the oldest unfulfilled order in `supabseOrders`
 */
function getEarliestUnfulfilledOrderDate(supabseOrders: CompressedOrder[]): Date {
    let earliestTime = Number.POSITIVE_INFINITY
    supabseOrders.forEach(order => {
        if (order.fulfilled) {
            return
        } // Skip fulfilled orders
        const placed_at = new Date(order.placed_at)
        earliestTime = Math.min(placed_at.getTime(), earliestTime)
    })
    return new Date(earliestTime)
}

/**
 * Combine Supabase and Royal Mail orders into `MergedOrder`s which contain data from both supplied objects
 * @param sbOrders
 * @param rmOrders
 */
function mergeOrders(sbOrders: CompressedOrder[], rmOrders: RmOrder[]): MergedOrder[] {
    const mergedOrders: MergedOrder[] = []
    sbOrders.forEach(sbOrder => {
        const truncatedID = sbOrder.id.slice(0, 40)
        const matchedRMOrders = rmOrders.filter(
            (rmOrder) => {
                return truncatedID === rmOrder.orderReference
            }
        )
        let mergedOrder: MergedOrder
        // Matching RM order found
        if (matchedRMOrders.length > 0) {
            const matchedRMOrder = matchedRMOrders[0]
            mergedOrder = {
                ...sbOrder,
                royalMailData: matchedRMOrder,
                dispatched: matchedRMOrder.shippedOn !== undefined
            }
        }
        // No matching RM Order found
        else mergedOrder = {...sbOrder, dispatched: false}

        // Either way, add the new merged order to the array
        mergedOrders.push(mergedOrder)
    })
    return mergedOrders
}