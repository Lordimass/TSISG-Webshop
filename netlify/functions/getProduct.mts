import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { compareImages } from '../lib/sortMethods.mts';
import { ProductData } from '../lib/types/supabaseTypes.mts';
import { flattenProducts } from './getProducts.mts';

// Lightweight definition only used pre-tag flattening
type UnflattenedProduct = {
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
        images:product_images(
            inserted_at,
            image_url,
            product_sku,
            display_order,
            alt,
            storage_object:objects(
            id,
            bucket_id,
            name,
            path_tokens,
            metadata
            )
        ),
        category:product_categories(*),
        tags:product_tags(tags(*))
        `)
        .eq("sku", sku);
    if (error) {
        console.error(error.message)
        return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
        // Add time the data was fetched at, useful for debugging
        let product: UnflattenedProduct = data[0] as unknown as UnflattenedProduct
        product.fetched_at = new Date().toISOString()

        // Flatten the tags array
        const flat_product: ProductData = {...product, tags: product.tags.map(pt => pt.tags)} as unknown as ProductData

        // Sort the images
        flat_product.images.sort(compareImages)

        return new Response(JSON.stringify(flattenProducts([flat_product])[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    } catch (err: any) {
        console.error(err.message)
        return new Response(err.message, {status: 500});
    }
};

