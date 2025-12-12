import {SupabaseClient} from "@supabase/supabase-js";
import {StatusedError} from "@shared/errors.ts";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";
import {CompressedOrder} from "@shared/types/supabaseTypes.ts";

/**
 * Fetch all orders from the `compressed_orders` view table on Supabase.
 * @param supabase The Supabase client to use to fetch this data.
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

/**
 * Gets the ID of a category, given its name as the body. If it doesn't exist, it will create a new category and return
 * the ID of that.
 *
 * @param supabase The Supabase client to use to fetch this datum.
 * @param categoryName The name of the category to fetch the ID of.
 * @returns A numeric ID related to the category name specified
 */
export async function getCategoryID(supabase: SupabaseClient, categoryName: string) {
    // Attempt to find record with given name
    const {data: searchData, error: searchError} = await supabase!
        .from('product_categories')
        .select("id")
        .eq("name", categoryName)
    if (searchError) throw searchError
    if (searchData.length > 0) return searchData[0].id

    // No category found, attempt to create category
    const { data: createData, error: createError } = await supabase!
        .from('product_categories')
        .insert([{name: categoryName}])
        .select()
    if (createError) throw createError;
    return createData[0].id;
}