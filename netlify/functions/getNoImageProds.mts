import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type prod = {
    sku: number,
    name: string,
    images: {
        id: number, 
        image_url: string, 
        display_order: number
    }[]
}

export default async function handler(_request: Request, _context: Context) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
    return new Response("Supabase credentials not set", { status: 500 });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Attempt to fetch data
    try {
    const { data, error } = await supabase
        .from('products')
        .select(`
        sku,
        name,
        images:product-images(
            id,
            image_url,
            display_order
        )
        `)
        .eq("active", true)
        .gt("stock", 0)

    if (error) {
        return {
        errorCode: 500,
        error: error
        };
    } else {
        const typedData = data as unknown as prod[]
        return new Response(JSON.stringify(purgeImagedProducts(typedData)), {
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

// Returns a new array containing only products with no images attached
function purgeImagedProducts(prods: prod[]) {
    const filter: prod[] = prods.filter((prod)=>prod.images.length==0)
    return filter.map((prod)=>{return {sku: prod.sku, name: prod.name}})
}

