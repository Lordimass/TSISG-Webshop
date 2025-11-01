import { callRPC } from "../../lib/supabaseRPC";
import { ProductData } from "@shared/types/types";

/**
 * Search the products using a full text search function in Supabase.
 * @param query The search query.
 * @param notify Function to notify if something goes wrong.
 * @returns A promise that resolves to an array of products.
 */
export async function searchProducts(query: string): Promise<ProductData[]> {
    // Could be improved using GIN/GIN+trgm indexes, but this is fine for now
    const data = await callRPC(
        "search_products", 
        { q: query, limit_results: 20 }, 
        () => {});
    return data;
}