import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(request: Request, _context: any) {
    const url: URL = new URL(request.url)

    // Verify that SKU was provided in search parameters
    if (!url.searchParams.has("sku")) {
        return new Response("No SKU provided", { status: 500 })
    }
    const sku = url.searchParams.get("sku")

    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Attempt to fetch data
    try {
    const { data, error } = await supabase
        .from('product-images')
        .select('id, image_url, display_order')
        .eq("product_sku", sku);

    if (error) {
        return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    } catch (err: any) {
    return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
    };
    }
};

