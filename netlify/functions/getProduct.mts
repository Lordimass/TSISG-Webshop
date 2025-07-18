import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lightweight definition without most of the content
// because its only necessary for modified properties
type product = {
    fetched_at? : string,
    tags: any,
}

/**
 * Fetches a single product's associated Supabase data, given a sku
*/
export default async function handler(request: Request, _context: Context) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        console.error("Supabase credentials not set")
        return new Response("Supabase credentials not set", { status: 401 });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    const body = JSON.parse(await new Response(request.body).text());
    const sku = body.sku

    // Attempt to fetch data
    try {
    const { data, error } = await supabase
        .from('products')
        .select(`
        *,
        images:product_images(*),
        category:product_categories(*),
        tags:product_tags(tags(*))
        `)
        .eq("sku", sku);
    if (error) {
        console.error(error.message)
        return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
        // Add time the data was fetched at, useful for debugging
        let product: product = data[0] as unknown as product
        product.fetched_at = new Date().toISOString()

        // Flatten the tags array
        product = {...product, tags: product.tags.map(pt => pt.tags)}

        return new Response(JSON.stringify(product), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    } catch (err: any) {
        console.error(err.message)
        return new Response(err.message, {status: 500});
    }
};

