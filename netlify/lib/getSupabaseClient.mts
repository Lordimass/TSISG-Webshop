import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Initialises a Supabase Client object.
 * @param authHeader The JWT token for the request, not required, will not be used if serviceRole = true 
 * @param serviceRole 
 * @returns 
 */
export default async function getSupabaseClient(authHeader?: string, serviceRole?: boolean): Promise<{error?: Response, supabase?: SupabaseClient}> {
  // Grab URL and Key from Netlify Env Variables.
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey || !supabaseServiceKey) {
    return {error: new Response(undefined, { status: 403, statusText: "Supabase credentials not set"})};
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

  return {supabase}
}

const respAnon = await getSupabaseClient()
if (respAnon.error) throw respAnon.error
export const supabaseAnon = respAnon.supabase!

const respService = await getSupabaseClient(undefined, true)
if (respService.error) throw respService.error
export const supabaseService = respService.supabase!