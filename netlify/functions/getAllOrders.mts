import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(request: Request, _context: Context) {
  // Grab URL and Key from Netlify Env Variables.
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  const authHeader = request.headers.get('Authorization');
  console.log(authHeader)

  // Validate that they were all successfully fetched.
  if (!supabaseUrl || !supabaseKey) {
    return new Response("Supabase credentials not set", { status: 500 });
  } else if (!authHeader) {
    return new Response("No Authorization supplied", {status: 403})
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey, {
    global: {headers: {Authorization: authHeader}}
  });

  // Attempt to fetch data
  try {
    const { data, error } = await supabase.from("orders_compressed").select("*")

    if (error) {
      console.error(error)
      return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
      console.log(`Returning ${data.length} orders from getAllOrders`)
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    console.error(err)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message }),
    };
  }
};