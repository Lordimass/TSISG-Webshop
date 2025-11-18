/**
 * Returns a list of shipping options that are available based on the
 * location of the customer.
 */

import { Context } from "@netlify/functions";
import { stripe } from "../lib/stripeObject.mts";
import {EU, UK} from "@shared/consts/shipping.ts";

let rates = JSON.parse(process.env.VITE_SHIPPING_OPTION_GROUPS ?? "{}")

export default async function handler(request: Request, _context: Context) {try {
    // Validate request
    const contentType = request.headers.get("Content-Type")
    if (contentType !== "application/json") {
        console.error(`'Content-Type' of request was not 'application/json', instead, it was: ${contentType}`)
        return new Response("'Content-Type' must be 'application/json'", {status: 400})
    } else if (!request.body) {
        console.error("Request did not have a body")
        return new Response("No body supplied", {status: 400})
    }
    const body = await request.json()
    if (!("country" in body) || typeof body.country !== "string") {
        console.error(`Request body was malformed: ${body}`)
        return new Response("Request body is malformed", {status: 400})
    } 

    // Validate form of `rates`
    if (
        !("uk" in rates && "eu" in rates && "world" in rates) ||
        !(rates.uk instanceof Array && rates.eu instanceof Array && rates.world instanceof Array)
    ) {
        console.error(`VITE_SHIPPING_OPTION_GROUPS object malformed: ${rates}`)
        console.error(rates)
        console.error(rates.uk instanceof Array && rates.eu instanceof Array && rates.world instanceof Array)
        return new Response("Shipping rates object malformed", {status: 500})
    }
    const typedRates = rates as {uk: any[], eu: any[], world: any[]}

    // Find shipping rates for the given country
    let applicableRates = typedRates.world
    if (UK.includes(body.country)) applicableRates = typedRates.uk
    else if (EU.includes(body.country)) applicableRates = typedRates.eu

    console.log(applicableRates)
    await stripe.checkout.sessions.update(body.checkoutID, {
        shipping_options: applicableRates.map(rate => {return {shipping_rate: rate}})
    })

    return new Response(JSON.stringify(applicableRates))

} catch (e) {
    console.error(e)
    return new Response(undefined, {status: 500})
}}