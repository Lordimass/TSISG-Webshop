import { callRPC } from "../../lib/supabaseRPC";
import { ProductData } from "../../lib/types";

/**
 * Search the products using a full text search function in Supabase.
 * @param query The search query.
 * @param notify Function to notify if something goes wrong.
 * @returns A promise that resolves to an array of products.
 */
export async function searchProducts(query: string, notify: (msg: string) => void = console.log): Promise<ProductData[]> {
    // Could be improved using GIN/GIN+trgm indexes, but this is fine for now
    try {
        const data = await callRPC(
            "search_products", 
            { q: query, limit_results: 20 }, 
            () => {});
        return data;
    } catch (error: any) {
        notify("Something went wrong with your search, sorry!");
        console.error("Error searching products:", error);
        return [];
    }
}