import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
        images:product-images(*),
        category:product-categories(*)
        `)
        .eq("sku", sku);
    if (error) {
        console.error(error.message)
        return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
        const product: {fetched_at? : string} = data[0] as unknown as {fetched_at? : string}
        product.fetched_at = new Date().toISOString()
        return new Response(JSON.stringify(data[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    } catch (err: any) {
        console.error(err.message)
        return new Response(err.message, {status: 500});
    }
};

