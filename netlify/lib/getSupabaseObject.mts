import { createClient, SupabaseClient } from "@supabase/supabase-js";

export default async function getSupabaseObject(authHeader?: string): Promise<{error?: Response, supabase?: SupabaseClient}> {
  // Grab URL and Key from Netlify Env Variables.
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return {error: new Response("Supabase credentials not set", { status: 500 })};
  }

  let supabase: SupabaseClient | undefined

  if (authHeader) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        global: {headers: {Authorization: authHeader}}
    });
  } else {
    supabase = createClient(supabaseUrl, supabaseKey)
  }

  return {supabase}

}