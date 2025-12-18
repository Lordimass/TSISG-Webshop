import { Context } from "@netlify/functions";
import express from 'express';
import { stripe } from "../lib/stripe.ts";
import {Currency} from "dinero.js";
import {SHIPPING_COUNTRIES} from "@shared/consts/shipping.ts";

const app = express();
app.use(express.static('public'));

type bodyParams = {
    stripe_line_items: Array<Object>,
    basket: {basket:basketItem[]}
    origin: string,
    gaClientID: string | null,
    gaSessionID: string | null,
    currency: Currency
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
    
    const body: bodyParams = await request.json();

    const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: body.stripe_line_items,
        mode: "payment",
        // TODO: Replace body origin with the origin of actual request.
        return_url: body.origin + "/thankyou?session_id={CHECKOUT_SESSION_ID}", 
        shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES},
        metadata: {
            "gaClientID": body.gaClientID,
            "gaSessionID": body.gaSessionID
        },
        automatic_tax: {enabled: true}
    })

    return new Response(JSON.stringify(session), {status: 200, headers: {
            'Access-Control-Allow-Origin': '*'
        }})
}