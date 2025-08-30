import { Context } from '@netlify/functions';
import getSupabaseObject from '../lib/getSupabaseObject.mts';
import { ProductData } from '../lib/types/supabaseTypes.mts';
import { compareImages } from '../lib/sortMethods.mts';

const SELECT_QUERY = `
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
`

export default async function handler(request: Request, _context: Context) {try {
  const {supabase, error: supErr} = await getSupabaseObject()
  if (supErr) return supErr

  // Function can accept a list of skus to fetch, instead of fetching all
  let skus: number[] | undefined = undefined
  if (request.body) {
    skus = await request.json()
  }

  // Fetch data
  let { data, error }: {data: any, error: any} = {data: null, error: null}
  if (!skus) {
    ({ data, error } = await supabase!
      .from('products')
      .select(SELECT_QUERY)
      .eq("active", true)
      .gt("stock", 0));
  } else {
    ({ data, error } = await supabase!
      .from('products')
      .select(SELECT_QUERY)
      .in("sku", skus)
    );
  }
  if (error) throw error

  return new Response(JSON.stringify(flattenProducts(data)), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

} catch (e) {
  console.error('Error fetching products:', e);
  return new Response(JSON.stringify([]), {status: 500, statusText: 'Internal Server Error'})
}

};

function flattenProducts(products: ProductData[]): ProductData[] {
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
    images.sort(compareImages)

    return {
      ...product,
      images
    };
  });
}