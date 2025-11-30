import { Context } from "@netlify/functions";
import getSupabaseClient from "../lib/getSupabaseClient.ts";
import type { WebhookPayload } from "@shared/types/supabaseTypes.ts";
import sharp from "sharp";
import { SupabaseClient } from "@supabase/supabase-js";
import {formatBytes} from "@shared/functions/functions.ts";

/**
 * Sync contents of product-images bucket with transformed-product-images
 *
 * This function is called by a Supabase Webhook,
 * DOCS: https://supabase.com/docs/guides/database/webhooks
 * Webhook Configuration: https://supabase.com/dashboard/project/iumlpfiybqlkwoscrjzt/integrations/webhooks/webhooks
 * For local development, use Cloudflared tunnel or similar with `cloudflared tunnel run`
 * @param request 
 * @param _context 
 * @returns 
 */
export default async function handler(request: Request, _context: Context): Promise<Response> {
    // Get body
    if (request.method !== "POST") {
        return new Response(`Method ${request.method} not allowed`, {status: 405});
    } else if (request.headers.get("Content-Type") !== "application/json") {
        return new Response("'Content-Type' must be 'application/json'", {status: 412})
    }
    const body: WebhookPayload = await request.json()

    // Authorise request.
    // Key is static so this isn't a hard and fast check, should still be careful with request contents.
    if (request.headers.get("Authorization") != `Bearer ${process.env.SUPABASE_WEBHOOK_SIGNING_SECRET}`) {
        return new Response(undefined, {status: 403})
    }

    // Ignore changes not in product-images bucket
    if (body.record?.bucket_id !== "product-images" && body.old_record?.bucket_id !== "product-images") {
        return new Response("Bucket modification was not in product-images, no action performed", {status: 200})
    }

    // Get service role Supabase Client for uploading new images and checking request contents
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient(undefined, true);}
    catch (e: any) {return new Response(e.message, { status: e.status })}
    
    // Construct the name of the transformed image
    let transformedName: string
    if (body.record) {
        transformedName = body.record.name.replace(/\.[^.]+$/, '.webp')
    } else {
        transformedName = body.old_record.name.replace(/\.[^.]+$/, '.webp')
    }

    // Transform file and upload (assuming this wasn't a delete request)
    if (body.type !== "DELETE") {
        // Fetch content of the file
        const { data: downloadData, error } = await supabase!.storage
            .from("product-images")
            .download(body.record.name)
        if (error) throw error
        if (!downloadData) return new Response("File not found", {status: 404})

        // Transform
        const untransformed: ArrayBuffer = await downloadData.arrayBuffer()
        const transformed: Buffer<ArrayBufferLike> = await sharp(untransformed)
            .resize(320)
            .toFormat("webp", {quality: 50, smartSubsample: true, smartDeblock: true, effort: 6})
            .toBuffer();

        // Upload to transformed-product-images
        const { error: uploadError } = await supabase!.storage
            .from("transformed-product-images")
            .upload(
                transformedName,
                transformed, {
                    contentType: "image/webp",
                    upsert: true
                }
            )
        if (uploadError) throw uploadError
        
        const log = `Transformed ${body.record.name} transformed: ${formatBytes(untransformed.byteLength)} -> ${formatBytes(transformed.byteLength)}`
        console.log(log)
        return new Response(log, {status: 204})
    } 
    // Delete transformed image to clean up unused files
    else if (body.type === "DELETE") {
        const { error: deleteError } = await supabase!.storage
            .from("transformed-product-images")
            .remove([transformedName])
        if (deleteError) throw deleteError

        const log = `Deleted image ${transformedName}`
        console.log(log)
        return new Response(log, {status: 204})
    }

    return new Response()
}