import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(request: Request, _context: Context) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    
    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const bodyObj: {id: number} = JSON.parse(bodyText)

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    var fulfilled: boolean = false;
    // Grab current value
    {
        const {data, error} = await supabase
            .from("orders")
            .select("fulfilled")
            .eq("id", bodyObj.id)
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
        const {data, error} = await supabase
            .from("orders")
            .update({fulfilled: !fulfilled})
            .eq("id", bodyObj.id)
            .select()
        if (error) {
            console.error(error)
            return new Response(JSON.stringify(error), {status: 500})
        } else {
            console.log(data)
            return new Response(JSON.stringify(data), {status: 200})
        }
    }
};

