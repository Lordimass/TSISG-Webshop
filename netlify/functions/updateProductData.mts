import { Context } from '@netlify/functions';
import { SupabaseClient } from '@supabase/supabase-js';
import getSupabaseClient from '../lib/getSupabaseClient.mts';
import { ProductData } from '../lib/types/supabaseTypes.mts';

export default async function handler(request: Request, _context: Context) { try {
    if (request.method !== 'POST') {
        return new Response("Method Not Allowed", {status: 405});
    }
    
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return new Response(undefined, {status: 403})
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient(authHeader);}
    catch (e: any) {return new Response(e.message, { status: e.status })}

    // Get the list of permissions that the user has.
    const token = authHeader.split(" ")[1]
    const AuthorisationResult = await getPerms(token, supabase!)
    if (!AuthorisationResult.ok) return AuthorisationResult
    const userPerms: string[] = JSON.parse(await AuthorisationResult.text())
    
    // Extract product from body
    const prod: ProductData = await request.json()
    console.log(prod)
    // Update Supabase product table
    const { error: prodErr } = await supabase!
        .from("products")
        .update({
            name: prod.name,
            price: userPerms.includes("edit_price") ? prod.price : undefined,
            // TODO: This is problematic, if the stock changes in the time it takes for someone to edit a product, this will overwrite the change, making stock keeping inaccurate.
            stock: prod.stock, 
            category_id: prod.category_id,
            active: prod.active,
            weight: prod.weight,
            customs_description: prod.customs_description,
            origin_country_code: prod.origin_country_code,
            package_type_override: prod.package_type_override,
            description: prod.description, 
            group_name: prod.group_name
        })
        .eq("sku", prod.sku)
    if (prodErr) throw prodErr

    const now = new Date().toISOString()
    // Create new product_images mappings
    const imgPayload = prod.images.map((img) => {return {
            product_sku: prod.sku,
            image_id: img.id,
            image_url: img.image_url,
            inserted_at: now, // Should be roughly `now()`, calculated by sender method
            display_order: img.display_order,
            alt: img.alt,
            association_metadata: img.association_metadata ?? {}
        }})
    const { error: imgError } = await supabase!
        .from("product_images")
        .upsert(imgPayload)
        .select(`*`)
    if (imgError) throw imgError

    // Remove old product_images mappings
    const {error: deleteError} = await supabase!
        .from("product_images")
        .delete()
        .eq("product_sku", prod.sku)
        .lt("inserted_at", now)
    if (deleteError) throw deleteError;

    return new Response(undefined, {status: 204})
} catch(e: any) {
    console.error(e); 
    return new Response(undefined, {status: 500});
}}

async function getPerms(token: string, supabase: SupabaseClient) {
    // Verify JWT and get user data
    const { data: user, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return new Response(undefined, {status: 401})
    }
    const perms = user.user.app_metadata.permissions

    return new Response(JSON.stringify(perms), {status: 200});
};