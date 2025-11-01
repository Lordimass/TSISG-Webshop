/**
 * Dynamically generated sitemap of all currently active and in stock products.
 */

import { Context } from "@netlify/functions";
import { baseUrl } from "./sitemap.mts";
import type { ProductData } from "../../shared/types/supabaseTypes.mts";
import getSupabaseClient from "../lib/getSupabaseClient.mts"
import { SupabaseClient } from "@supabase/supabase-js";

export default async function handler(_request: Request, _context: Context) {
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient();}
    catch (e: any) {return new Response(e.message, { status: e.status })}

    const {data, error: fetchErr} = await supabase!.rpc("get_products");
    if (fetchErr) throw fetchErr;
    const products = data as ProductData[]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${products.map(prod => {
        const d = new Date(prod.last_edited)
        return `
            <url>
                <loc>${baseUrl}/products/${prod.sku}</loc>
                <lastmod>${d.getFullYear()}-${d.getMonth().toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}</lastmod>
                <changefreq>daily</changefreq>
                <priority>${prod.metadata.seo_priority ?? 0.5}</priority>
            </url>
        `}).join("")}
    </urlset>
    `

    return new Response(xml, {
    status: 200,
    headers: {
        "Content-Type": "application/xml"
    }
    });
}