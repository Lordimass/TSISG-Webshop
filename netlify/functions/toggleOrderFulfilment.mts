import { Context } from '@netlify/functions';
import getSupabaseClient from "../lib/getSupabaseClient.ts";
import { SupabaseClient } from '@supabase/supabase-js';

export default async function handler(request: Request, _context: Context) {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) return new Response("No Authorization supplied", {status: 403})
    let supabase: SupabaseClient
    try {supabase = await getSupabaseClient(authHeader);}
    catch (e: any) {return new Response(e.message, { status: e.status })}

    
    const {id} = await request.json();

    let fulfilled: boolean = false;
    // Grab current value
    {
        const {data, error} = await supabase!
            .from("orders")
            .select("fulfilled")
            .eq("id", id)
        if (error) {
            return new Response(JSON.stringify(error), {status: 500})
        }
        if (!data || data.length > 1) {
            return new Response("Multiple orders mapped to this ID", {status: 500})
        }
        fulfilled = data[0].fulfilled
    }

    // Set to opposite value
    {
        const {data, error} = await supabase!
            .from("orders")
            .update({fulfilled: !fulfilled})
            .eq("id", id)
            .select()
        if (error) {
            console.error(error)
            return new Response(JSON.stringify(error), {status: 500})
        } else {
            console.log(data)
        }
    }
    
    return new Response(null, {status: 200})
};

