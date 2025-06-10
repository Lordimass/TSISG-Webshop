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
        sku,
        price,
        name,
        stock,
        active,
        category_id,
        sort_order,
        images:product-images(
          id,
          image_url,
          display_order
        )
      `)
      .eq("active", true)
      .gt("stock", 0)
      ;

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

