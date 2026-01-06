import {RmOrder} from "@shared/types/royalMailTypes.ts";
import {StatusedError} from "@shared/errors.ts";
import {CompressedOrder, MergedOrder} from "@shared/types/supabaseTypes.ts";

/**
 * Fetch all orders after some given date from Royal Mail
 * @param start The start date to return all orders afterwards.
 * @returns An array of `RmOrder`s
 */
export async function fetchRoyalMailOrders(start: Date) {
    const key = process.env.ROYAL_MAIL_KEY
    if (!key) throw new StatusedError("ROYAL_MAIL_KEY not found in environment variables", 403)

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
            throw data
        }
    }
    return orders;
}

/**
 * Combine Supabase and Royal Mail orders into `MergedOrder`s which contain data from both supplied objects
 * @param sbOrders
 * @param rmOrders
 */
export function mergeOrders(sbOrders: CompressedOrder[], rmOrders: RmOrder[]): MergedOrder[] {
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