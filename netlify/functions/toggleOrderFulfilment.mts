import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export default async function handler(request: Request, _context: Context) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const royalMailKey = process.env.ROYAL_MAIL_KEY;

    // Validate that they were successfully fetched.
    if (!supabaseUrl || !supabaseKey || !royalMailKey) {
        return new Response("Credentials environment variables not set", { status: 500 });
    }
    
    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const bodyObj: {id: string} = JSON.parse(bodyText)

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
        }
    }

    // Retained in case I'm misunderstanding, but orders should be marked as fulfilled by
    // Royal Mail themselves once they're handed over.

    // // Update Royal Mail Status
    // const orderRef = bodyObj.id.slice(0,40) // Max length for RM Ref is 40
    // const newStatus = fulfilled ? "despatched" : "new"
    // const response = await fetch("https://api.parcel.royalmail.com/api/v1/orders/status", {
    //     method: "POST",
    //     headers: {
    //         Authorization: `Bearer ${royalMailKey}`,
    //         "Content-Type": "application/json"
    //     },
    //     body: JSON.stringify({items: [{
    //         orderReference: orderRef,
    //         status: newStatus
    //     }]})
    // })
    // console.log(response)
    // console.log(await new Response(response.body).text())
    // const respBody = JSON.parse(await new Response(response.body).text())
    // if (respBody.errors.length > 0) {
    //     return new Response(JSON.stringify(respBody.errors), {status: 500})
    // }
    
    return new Response(null, {status: 200})
};

