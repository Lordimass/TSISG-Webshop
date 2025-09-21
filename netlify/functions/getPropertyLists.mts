// Returns various lists of properties that are useful for autofill etc.,
// currently these are:
// * Tags
// * Categories

import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(_request: Request, _context: Context) {
  // Grab URL and Key from Netlify Env Variables.
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  // Validate that they were both successfully fetched.
  if (!supabaseUrl || !supabaseKey) {
    return new Response("Supabase credentials not set", { status: 401 });
  }

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

  const tagsResp = await propFetch(supabase, "tags", "name")
  const categoriesResp = await propFetch(supabase, "product_categories", "id, name")
  if (!tagsResp.ok) {
    return tagsResp
  } else if (!categoriesResp.ok) {
    return categoriesResp
  } else {
    return new Response(JSON.stringify({
        tags: await tagsResp.json(),
        categories: await categoriesResp.json()
    }), {status: 200})
  }
  
};

/**
 * Fetches IDs and Names from the given table.
 * @param supabase 
 * @param table_name 
 * @param columns 
 */
async function propFetch(supabase: SupabaseClient, table_name: string, columns: string) {
    try {
        const {data, error} = await supabase
            .from(table_name)
            .select(columns)
        if (error) {
            return new Response(JSON.stringify(error), {status: 502})
        }
        else {
            return new Response(JSON.stringify(data), {status: 200})
        }
    } catch(e: any) {
        console.error("Exception in propFetch:", e);
        return new Response("Internal server error", {status: 500});
    }
}