import {SupabaseClient} from "@supabase/supabase-js";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";
import {CompressedOrder, TagData} from "@shared/types/supabaseTypes.ts";
import getSupabaseClient from "../../netlify/lib/getSupabaseClient.ts";

/**
 * Wrapper method for {@link SupabaseClient.from.select}
 * @param supabase The Supabase client to use to fetch this data.
 * @param tableName The name of the table to draw data from
 * @param columns The columns to retrieve, separated by commas. Columns can be renamed when returned with
 * `customName:columnName`
 */
export async function fetchColumnsFromTable(supabase: SupabaseClient, tableName: string, columns: string): Promise<any[]> {
    const {data, error} = await supabase
        .from(tableName)
        .select(columns)
    if (error) throw error;
    return data
}

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

/**
 * Set the tags associated with a product on Supabase.
 * @param supabase Supabase client to use to perform this operation.
 * @param productSku
 * @param tags
 */
export async function setProductTags(supabase: SupabaseClient, productSku: number, tags: TagData[]) {
    // Create tags if they don't already exist
    const minimalTags = tags.map(tag => {return {name: tag.name}})
    const {error: insertError} = await supabase!
        .from("tags")
        .upsert(minimalTags, { onConflict: "name", ignoreDuplicates: true })
    if (insertError) throw insertError

    // Remove existing product_tags entries for the SKU
    const {error: deleteError} = await supabase!
        .from("product_tags")
        .delete()
        .eq("sku", productSku);
    if (deleteError) throw deleteError;

    // Map tags to product_tags entries
    const mapping = tags.map(tag => ({sku: productSku, tag: tag.name}));
    const {error: mappingError} = await supabase!
        .from("product_tags")
        .upsert(mapping, { onConflict: "sku, tag", ignoreDuplicates: true });
    if (mappingError) throw mappingError;
}