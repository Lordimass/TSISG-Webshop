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
        images:product_images(*),
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
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    console.error(err.message)
    return new Response(JSON.stringify(err.message), {status: 500})
  }
};

