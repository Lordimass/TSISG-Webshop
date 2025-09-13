import { supabase } from "../../../app";

/**
 * Search the products using a full text search function in Supabase.
 * @param query The search query.
 * @param notify Function to notify if something goes wrong.
 * @returns A promise that resolves to an array of products.
 */
export async function searchProducts(query: string, notify: (msg: string) => void = console.log): Promise<any[]> {
    // Could be improved using GIN/GIN+trgm indexes, but this is fine for now
    const { data, error } = await supabase.rpc("search_products", { q: query, limit_results: 20 });
    if (error) {
        notify("Something went wrong with your search, sorry!: " + error.message);
        console.error("Search error:", error);
        return [];
    }

    return data; // array of products
}