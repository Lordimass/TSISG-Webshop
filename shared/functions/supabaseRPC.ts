import {CompressedOrder, ProductData} from "@shared/types/supabaseTypes.ts";
import {SupabaseClient} from "@supabase/supabase-js";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";

export async function callRPC(
    functionName: string,
    supabase: SupabaseClient,
    params?: { [key: string]: any },
    notify?: (msg: string) => void,
): Promise<any> {
    const {data, error} = await supabase.rpc(functionName, params);
    if (error) {
        console.error(`Error calling RPC function "${functionName}":`, error);
        if (notify) notify(`An error occurred while calling the "${functionName}" function. Please try again later.`);
        return Promise.reject(error);
    } else {
        return data;
    }
}

export async function getProducts(supabase: SupabaseClient, skus?: number[], in_stock_only = false, active_only = true
): Promise<ProductData[]> {
    if (skus && skus.length === 0) return []
    const prods = await callRPC(
        "get_products",
        supabase,
        {skus: skus || null, in_stock_only, active_only}
    );
    if (!VALIDATORS.ProductData(prods[0])) { // Checking the first item is enough since they'll all be the same shape
        console.warn("Fetched products not in expected shape 'ProductData':")
        console.log(JSON.stringify(prods[0], null, 2));
        logValidationErrors("ProductData");
    }
    return prods;
}

/**
 * Update the `fulfilled` column of an order to be the opposite of whatever it is now
 * @example {...order, fulfilled: false} -> {...order, fulfilled: true}
 * @param supabase Supabase object to perform the action with
 * @param id The full ID of the order to update.
 */
export async function toggleOrderFulfilment(supabase: SupabaseClient, id: string): Promise<CompressedOrder> {
    const orders = await callRPC(
        "toggle_order_fulfilment",
        supabase,
        {order_id: id}
    )
    if (!VALIDATORS.CompressedOrder(orders[0])) {
        console.warn("Returned order not in expected shape 'CompressedOrder':")
        console.log(JSON.stringify(orders[0], null, 2));
        logValidationErrors("CompressedOrder");
    }
    return orders[0] as CompressedOrder;
}