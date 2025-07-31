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
      .from('site_settings')
      .select(`id, display_name, value`);

    if (error) {
      console.error(error.message)
      return new Response(JSON.stringify("Supabase API call returned an error."), { status: 502 });
    } else {
      return new Response(JSON.stringify(
        Object.fromEntries(data.map((row) => { // Map the array of rows to an object with row id as key
          row.value.display_name = row.display_name // Embed the display name in the value
          return [row.id, row.value]
        }))
      ), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch (err: any) {
    console.error(err.message)
    return new Response(JSON.stringify("An error occured while trying to fetch data"), {status: 500})
  }
};
