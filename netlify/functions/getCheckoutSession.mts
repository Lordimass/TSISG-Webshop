// Retrieves the Stripe Checkout Session associated with the ID given
// in the body of the call.

import { Context } from "@netlify/functions";
import Stripe from "stripe";

var stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_SECRET_KEY does not exist!")
}

export default async function handler(request: Request, _context: Context) {
    if (!stripe) {
        return new Response("Failed to create Stripe Session", {status: 500})
    }
    const id: string = await new Response(request.body).text()
    const session = await stripe.checkout.sessions.retrieve(id)
    return new Response(
        JSON.stringify(session),
        {status: 200}
    )
}