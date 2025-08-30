import { Context } from "@netlify/functions";
import Stripe from 'stripe';
import express from 'express';

var stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_SECRET_KEY does not exist!")
}

const app = express();
app.use(express.static('public'));

type bodyJSONParams = {
    shipping_options: Array<{shipping_rate: string}>,
    stripe_line_items: Array<Object>,
    basket: {basket:basketItem[]}
    origin: string,
    gaClientID: string | null,
    gaSessionID: string | null
}

type basketItem = {
    sku: number,
    basketQuantity: number,
    images: Array<Object>
    price: number
}

export default async function handler(request: Request, _context: Context) {
    // TODO: Add authentication for this request
    if (!stripe) {
        return new Response(null, {
            status: 400,
            statusText: "Failed to connect to stripe."
        })
    }
    
    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const bodyJSON: bodyJSONParams = JSON.parse(bodyText)

    const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: bodyJSON.stripe_line_items,
        mode: "payment",
        currency: "gbp",
        // TODO: Replace body origin with the origin of actual request.
        return_url: bodyJSON.origin + "/thankyou?session_id={CHECKOUT_SESSION_ID}", 
        shipping_options: bodyJSON.shipping_options,
        shipping_address_collection: { allowed_countries: []},
        metadata: {
            "gaClientID": bodyJSON.gaClientID,
            "gaSessionID": bodyJSON.gaSessionID
        },
        automatic_tax: {enabled: true}
    })

    return new Response(JSON.stringify(session), {status: 200, headers: {
            'Access-Control-Allow-Origin': '*'
        }})
}