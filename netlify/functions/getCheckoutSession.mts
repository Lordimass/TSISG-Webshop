// Retrieves the Stripe Checkout Session associated with the ID given
// in the body of the call.

import { Context } from "@netlify/functions";
import { stripe } from "../lib/stripe.ts";

export default async function handler(request: Request, _context: Context) {
    const id: string = await new Response(request.body).text()
    const session = await stripe.checkout.sessions.retrieve(id)
    return new Response(JSON.stringify(session))
}