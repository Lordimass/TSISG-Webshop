import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Initialises a Supabase Client object.
 * @param authHeader The JWT token for the request, not required, will not be used if serviceRole = true 
 * @param serviceRole 
 * @returns 
 */
export default async function getSupabaseClient(authHeader?: string, serviceRole?: boolean): Promise<SupabaseClient> {
  // Grab URL and Key from Netlify Env Variables.
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
    throw { status: 403, message: "Supabase credentials not set"}
  }

  let supabase: SupabaseClient | undefined

  if (serviceRole) {
    supabase = createClient(supabaseUrl, supabaseServiceKey)
  } else if (authHeader) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        global: {headers: {Authorization: authHeader}}
    });
  } else {
    supabase = createClient(supabaseUrl, supabaseKey)
  }

  return supabase
}

export const supabaseAnon = await getSupabaseClient()
export const supabaseService = await getSupabaseClient(undefined, true)