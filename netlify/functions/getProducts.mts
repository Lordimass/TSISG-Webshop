import { Context } from '@netlify/functions';
import getSupabaseClient from "../lib/getSupabaseClient.mts";
import { ProductData } from '../lib/types/supabaseTypes.mts';
import { compareImages } from '../lib/sortMethods.mts';

export default async function handler(request: Request, _context: Context) {try {
  const {supabase, error: supErr} = await getSupabaseClient()
  if (supErr) return supErr

  // Function can accept a list of skus to fetch, instead of fetching all
  let skus: number[] | null = null
  if (request.body) {
    skus = await request.json()
  }

  // Fetch data
  const {data, error} = await supabase!.rpc("get_products", { skus });
  if (error) throw error

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

} catch (e) {
  console.error('Error fetching products:', e);
  return new Response(e.message ?? JSON.stringify(e), {status: 500} )
}

};

export function flattenProducts(products: ProductData[]): ProductData[] {
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