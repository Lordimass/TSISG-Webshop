import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
      .eq("active", true)
      .gt("stock", 0)
      ;

    if (error) {
      console.error(error.message)
      return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
      return new Response(JSON.stringify(flattenProducts(data)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    console.error(err.message)
    return new Response(JSON.stringify(err.message), {status: 500})
  }
};

function flattenProducts(products) {
  return products.map(product => {
    const images = (product.images || []).map((img: any) => {
      const obj = img.storage_object ?? {};
      return {
        // original fields
        inserted_at: img.inserted_at,
        image_url: img.image_url,
        product_sku: img.product_sku,
        display_order: img.display_order,
        alt: img.alt,

        // flattened fields
        id: obj.id ?? null,
        bucket_id: obj.bucket_id ?? null,
        name: obj.name ?? null,
        path_tokens: obj.path_tokens ?? null,
        metadata: obj.metadata ?? null,
      };
    });

    return {
      ...product,
      images
    };
  });
}