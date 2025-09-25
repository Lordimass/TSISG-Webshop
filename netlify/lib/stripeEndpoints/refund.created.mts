import Stripe from "stripe"
import { getCheckoutSessionItems, StripeCompoundLineItem } from "../getCheckoutSessionItems.mts"
import { stripe } from "../stripeObject.mts"
import { stripeCompoundItemsToGA4Items } from "./checkout.session.completed.mts"
import { sendGA4Event } from "../lib.mts"

/**
 * Triggers a GA4 event for a refund.
 * @param event - The Stripe event object.
 */
export async function handleRefundCreated(event: Stripe.RefundCreatedEvent) {
    // Do nothing if we're not in production
    const env = process.env.VITE_ENVIRONMENT
    if (env !== "PRODUCTION") {
        console.log(`No GA4 Event Triggered since this is not a production environment: ${env}`)
        return
    }

    // Extract refund from event.
    const refund: Stripe.Refund = event.data.object
    console.log(refund)

    // Find the associated checkout session
    const checkoutSessionResponse = await stripe.checkout.sessions.list({
        payment_intent: (refund.payment_intent as string) ?? undefined,
        limit: 1
    })
    console.log(`checkoutSessionResponse: ${checkoutSessionResponse}`)
    const session: Stripe.Checkout.Session | undefined = checkoutSessionResponse.data[0]
    if (!session) {throw new Error("No checkout session found for refund: " + refund.id)}

    // Get the associated LineItems and Products compounded together.
    const lineItems: StripeCompoundLineItem[] = await getCheckoutSessionItems(session.id);
    console.log(`lineItems: ${lineItems}`)

    // Extract client ID and session ID
    const client_id = session.metadata?.gaClientID;
    const session_id = Number(session.metadata!.gaSessionID);
    console.log("GA Client ID:", client_id);
    console.log("GA Session ID:", session_id);

    const payload = {
        client_id: client_id,
        events: [{ name: "refund", params: {
            debug_mode: process.env.VITE_ENVIRONMENT === "DEVELOPMENT",
            session_id: session_id,
            transaction_id: session.id,
            value: ((session.amount_total ?? 0) - (session.shipping_cost?.amount_total ?? 0)) / 100,
            tax: (session.total_details?.amount_tax ?? 0)/100,
            shipping: (session.total_details?.amount_shipping ?? 0)/100,
            currency: refund.currency,
            items: stripeCompoundItemsToGA4Items(lineItems, refund.currency)
        }}]
    }
    console.log(`GA4 Payload ${payload}`)
    await sendGA4Event(payload);
}