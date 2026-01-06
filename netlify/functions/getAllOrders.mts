import {Context} from '@netlify/functions';
import {SupabaseClient} from '@supabase/supabase-js';
import getSupabaseClient from "../lib/getSupabaseClient.ts";
import type {CompressedOrder, MergedOrder} from '@shared/types/supabaseTypes.ts';
import {StatusedError} from "@shared/errors.ts";
import {VALIDATORS} from "@shared/schemas/schemas.ts";
import {fetchCompressedOrders} from "@shared/functions/supabase.ts";
import {fetchRoyalMailOrders, mergeOrders} from "@shared/functions/royalMail.ts";

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
        if (VALIDATORS.StatusedError(error)) {
            error = error as StatusedError;
            return new Response(error.message, {status: error.status})
        }
        return new Response(JSON.stringify(error), {status: 500})
    }
};

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