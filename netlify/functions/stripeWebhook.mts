/**
 * Endpoint for Stripe webhooks. Authenticates requests and forwards the request
 * to the function it needs to be at
 */
import {Context} from "@netlify/functions";
import {stripe} from "../lib/stripe.ts";
import Stripe from "stripe";
import handleCheckoutSessionCompleted from "../lib/stripeEndpoints/checkout.session.completed.ts";
import {handleRefundCreated} from "../lib/stripeEndpoints/refund.created.ts";

export default async function handler(request: Request, _context: Context) {
    try {
        if (!stripe) {return new Response("Stripe object didn't initialise", {status: 500})}

        // Extract signature and pick secret to authenticate with
        const endpointSecret = process.env.STRIPE_HOOK_SECRET
        if (!endpointSecret) return new Response(undefined, {status: 401, statusText: "No Stripe endpoint secret set"});
        const sig = request.headers.get("stripe-signature");
        if (!sig) return new Response(undefined, {status: 401, statusText: "No Stripe signature received"});

        // Extract body
        const bodyString = await request.text();
        const body: Stripe.Event = JSON.parse(bodyString);

        // Authenticate Request
        try {
            stripe.webhooks.constructEvent(bodyString, sig, endpointSecret)
        } catch (err) {
            console.error("Failed to verify webhook signature: ", err)
            return new Response(undefined, {status: 400, statusText: "Failed to verify webhook signature"})
        }

        // Check event type and handle accordingly
        const type = body.type
        console.log(`Received Stripe Webhook of type ${type}`)
        switch (type) {
            case "checkout.session.completed":
                await handleCheckoutSessionCompleted(body)
                break;
            case "refund.created":
                await handleRefundCreated(body)
                break;
            default:
                console.log(`Event '${type}'did not map to a function`)
                break;
        }
        return new Response(undefined, {status: 200})
    } catch (e) {
        console.error(e)
        return new Response(undefined, {status: 500})
    }
}