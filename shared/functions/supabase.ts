import {SupabaseClient} from "@supabase/supabase-js";
import {StatusedError} from "@shared/errors.ts";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";
import {CompressedOrder} from "@shared/types/supabaseTypes.ts";

/**
 * Fetch all orders from the `compressed_orders` view table on Supabase.
 * @param supabase The supabsae object to use to fetch this data.
 * @returns A list of `CompressedOrder` objects
 */
export async function fetchCompressedOrders(supabase: SupabaseClient) {
    const {data, error} = await supabase.from("orders_compressed").select("*")
    if (error) {
        throw error;
    } else if (VALIDATORS.CompressedOrder(data[0])) {
        console.warn("Fetched orders not in expected shape 'CompressedOrder'")
        console.log(JSON.stringify(data[0], null, 2))
        logValidationErrors("CompressedOrder");
    }
    return data as CompressedOrder[];
}