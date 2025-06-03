// Used to convert from a COMPLETED stripe checkout ID to
// stripe data for GA4 logging. It also grabs the data from
// the database since Stripe doesn't include products

import { Context } from "@netlify/functions";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type Body = {stripeSessionId: string}

var stripe: Stripe | null = null;
if (process.env.SECRET_STRIPE_KEY) {
    stripe = new Stripe(process.env.SECRET_STRIPE_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_KEY does not exist!")
}

export default async function handler(request: Request, _context: Context) {
    if (!stripe) {
        return new Response(null, {
            status: 500,
            statusText: "Failed to connect to stripe."
        })
    }
    const body: Body = JSON.parse(await new Response(request.body).text());

    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    }
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

    // Attempt to fetch Supabase data
    var supabaseData;
    try {
    const { data, error } = await supabase.from("orders-compressed").select("*").eq("id", body.stripeSessionId)

    if (error) {
        return new Response(JSON.stringify(error.message), { status: 500 });
    } else {
        supabaseData = data
    }
    } catch (err: any) {
    return {
        statusCode: 500,
        body: JSON.stringify({ message: err.message }),
    };
    }

    // Fetch stripe data
    const stripeData = await stripe.checkout.sessions.retrieve(body.stripeSessionId)
    return new Response(JSON.stringify({
        supabase: supabaseData[0],
        stripe: stripeData
    }))
}
