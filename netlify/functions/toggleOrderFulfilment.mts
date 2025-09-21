import { Context } from '@netlify/functions';
import getSupabaseClient from "../lib/getSupabaseClient.mts";

export default async function handler(request: Request, _context: Context) {
    const authHeader = request.headers.get("Authorization")
    if (!authHeader) {
        return new Response("No Authorization supplied", {status: 403})
    }
    const {error, supabase} = await getSupabaseClient(authHeader)
    if (error) {return error}
    
    const {id, delivery_cost} = await request.json();

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
            .update({fulfilled: !fulfilled, delivery_cost: delivery_cost})
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

