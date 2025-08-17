import { Context } from "@netlify/functions";
import getSupabaseClient from "../lib/getSupabaseClient.mts";

export default async function handler(request: Request, context: Context): Promise<Response> {
    try {
        if (request.method !== "POST") {
            return new Response("Method Not Allowed", { status: 405 });
        } if (request.headers.get("content-type") !== "application/json") {
            return new Response("Content type must be application/json", { status: 415 });
        }
        const authHeader = request.headers.get("Authorization");
        if (!authHeader) {
            return new Response("Unauthorized", { status: 401 });
        }
        const { supabase, error: supErr} = await getSupabaseClient(authHeader);
        if (supErr) return supErr;

        const body = await request.json();
        if (!body || !body.sku || !body.tags) {
            return new Response("Invalid request body", { status: 400 });
        }
        const {sku, tags} = body

        // Create tags if they don't already exist
        const tagMapping = tags.map((tag: string) => ({name: tag}));
        const {error: insertError} = await supabase!
            .from("tags")
            .upsert(tagMapping, { onConflict: "name", ignoreDuplicates: true })
        if (insertError) throw insertError

        // Remove existing product_tags entries for the SKU
        const {error: deleteError} = await supabase!
            .from("product_tags")
            .delete()
            .eq("sku", body.sku);
        if (deleteError) throw deleteError;

        // Map tags to product_tags entries
        const mapping = tags.map((tag: string) => ({sku, tag}));
        const {error: mappingError} = await supabase!
            .from("product_tags")
            .upsert(mapping, { onConflict: "sku, tag", ignoreDuplicates: true });
        if (mappingError) throw mappingError;

        return new Response(undefined, { status: 204 })

    } catch (error) {
        console.error("Error occurred while setting product tags:", error);
        return new Response(undefined, { status: 500, statusText: "Internal Server Error" });
    }
}