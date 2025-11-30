// Retrieves the Stripe Checkout Session associated with the ID given
// in the body of the call.

import { Context } from "@netlify/functions";
import { stripe } from "../lib/stripeObject.ts";

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