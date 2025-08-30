/**
 * Stripe Webhook endpoint to trigger GA4 purchase event when a payment is successful
 * 
 * Purchase events are mapped to customers ideally, but this will act as a fallback
 * if the client-side trigger fails for any reason. This is still not ideal since
 * it won't capture as part of the user journey.
 */

import { Context } from "@netlify/functions";
import Stripe from "stripe";
import { stripe } from "../lib/stripeObject.mts";
import { getCheckoutSessionItems, StripeCompoundLineItem } from "../lib/getCheckoutSessionItems.mts";
import { StripeProductMeta } from "../lib/types/stripeTypes.mts";

export default async function handler(request: Request, context: Context) {
    if (!stripe) {return new Response("Stripe object didn't initialise", {status: 500})}

    // Extract signature and pick secret to authenticate with
    const endpointSecret = process.env.STRIPE_GA4_SYNC_KEY ?? process.env.STRIPE_WEBHOOK_SECRET 
    if (!endpointSecret) return new Response(undefined, {status: 401, statusText: "No Stripe endpoint secret set"});
    const sig = request.headers.get("stripe-signature");
    if (!sig) return new Response(undefined, {status: 401, statusText: "No Stripe signature received"});

    // Extract body
    const bodyString = await request.text();

    // Authenticate Request
    let stripeEvent: Stripe.Event
    try {
        stripeEvent = stripe.webhooks.constructEvent(bodyString, sig, endpointSecret)
    } catch (err) {
        console.error("Failed to verify webhook signature: ", err.message)
        return new Response(undefined, {status: 400, statusText: "Failed to verify webhook signature"})
    }

    // Check event type and handle accordingly
    const body: Stripe.Event = JSON.parse(bodyString);
    if (body.type === "checkout.session.completed") handleCheckoutSessionCompleted(body);
    else if (body.type === "refund.created") handleRefundCreated(body);
}

async function handleCheckoutSessionCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
    // Extract checkout session from event.
    const session: Stripe.Checkout.Session = event.data.object

    // Get the associated LineItems and Products compounded together.
    const lineItems: StripeCompoundLineItem[] = await getCheckoutSessionItems(session.id);

    // Extract client ID and session ID
    const client_id = session.metadata?.gaClientID;
    const session_id = Number(session.metadata!.gaSessionID);
    console.log("GA Client ID:", client_id);
    console.log("GA Session ID:", session_id);

    // Compile payload for GA4.
    const payload = {
        client_id,
        events: [{ name: "purchase", params: {
            debug_mode: process.env.VITE_ENVIRONMENT === "DEVELOPMENT",
            session_id,
            transaction_id: session.id, // Stripe Checkout Session ID is the ID of an order/transaction.
            shipping: (session.total_details?.amount_shipping ?? 0)/100,
            tax: (session.total_details?.amount_tax ?? 0)/100,
            value: ((session.amount_total ?? 0) - (session.shipping_cost?.amount_total ?? 0)) / 100,
            currency: session.currency,
            items: lineItems.map(({lineItem, product}) => {
                // Verify that the metadata matches the expected format.
                if (!product.metadata) throw new Error("Product is missing metadata");
                const metadata: StripeProductMeta = product.metadata as unknown as StripeProductMeta
                if (!metadata.sku) throw new Error("Product is missing required metadata, cannot send serverside GA4 event.");
                return {
                    item_id: metadata.sku,
                    item_name: product.name,
                    item_category: metadata.category,
                    price: lineItem.amount_total / 100,
                    quantity: lineItem.quantity,
                    currency: session.currency,
                }
            })
        }}]
    }

    console.log("GA4 Payload:", payload)

    // Send the payload to GA4
    //
    // To debug payload format in development env, send to:
    // https://region1.google-analytics.com/debug/mp/collect
    // This will *not* show up in debug view, but will log issues with the payload.
    const response = await fetch(`https://region1.google-analytics.com/mp/collect?api_secret=${process.env.GA4_MEASUREMENT_PROTOCOL_SECRET}&measurement_id=${process.env.VITE_GA4_MEASUREMENT_ID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        console.error("Failed to send GA4 event: ", response.statusText)
    } else {
        console.log("Successfully sent GA4 event", response.status, response.statusText)
        console.log("GA4 Debug Response:", await response.json())
    }

}

function handleRefundCreated(event: Stripe.RefundCreatedEvent) {
    // TODO: Handle refund created event by sending a refund event to GA4
    return;
}