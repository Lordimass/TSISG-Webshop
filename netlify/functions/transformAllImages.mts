import { Context } from "@netlify/functions";
import getSupabaseClient from "../lib/getSupabaseClient.mts";
import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Artificially trigger the imageTransformer for every product-image.
 * 
 * THIS FUNCTION DOESN'T WORK PROPERLY BECAUSE IT TIMES OUT AFTER 30 SECONDS
 */
export default async function handler(request: Request, context: Context): Promise<Response> {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) return new Response(undefined, {status: 403, statusText: "No Authorization supplied"})
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient(authHeader);}
    catch (e: any) {return new Response(e.message, { status: e.status })}

    // Fetch list of images
    const {data: imagesList, error: imagesListError} = await supabase!
        .from("objects")
        .select("*")
        .eq("bucket_id", "product-images")
    if (imagesListError) throw imagesListError

    // Spoof an imageTransformer call for every image
    for (let i=0; i<imagesList.length; i++) {
        await fetch(context.url.origin + "/.netlify/functions/imageTransformer", {
            headers: {
                "Authorization": `Bearer ${process.env.SUPABASE_WEBHOOK_SIGNING_SECRET}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                type: "UPDATE",
                table: "objects",
                schema: "storage",
                record: imagesList[i],
                old_record: imagesList[i]
            }), 
            method: "POST"
        })
    }

    return new Response()
}