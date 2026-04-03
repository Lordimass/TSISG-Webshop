import {Context} from "@netlify/functions";
import {stripe} from "../lib/stripe.ts";
import {AllowedCountry, EU, SHIPPING_COUNTRIES, UK} from "@shared/consts/shipping.ts";
import {VALIDATORS} from "@shared/schemas/schemas.ts";
import {ShippingOptionGroups} from "@shared/types/shipping.ts";
import Stripe from "stripe";
import {StripeAddressElementChangeEvent} from "@stripe/stripe-js";

interface Body {
    checkoutID: string;
    shipping_details: StripeAddressElementChangeEvent["value"]
}

let untypedRates: unknown = JSON.parse(process.env.VITE_SHIPPING_RATES ?? "{}")

/**
 * Returns a list of shipping options that are available based on the
 * location of the customer.
 * @see Body
 */
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
    const body: Body = await request.json()

    // Validate form of `rates`
    if (!VALIDATORS.ShippingOptionGroups(untypedRates)) {
        console.error(
            `VITE_SHIPPING_RATES is malformed: ${JSON.stringify(untypedRates, undefined, 2)}`
        )
        return new Response("VITE_SHIPPING_RATES is malformed", {status: 400})
    }
    const rateNames = untypedRates as ShippingOptionGroups;

    const country = body.shipping_details.address.country;
    if (!SHIPPING_COUNTRIES.includes(country as AllowedCountry)) {
        console.log("Cannot ship to " + country)
        return new Response("Sorry! We can't ship to this location...", {status: 400})
    }

    let applicableRateNames = rateNames.world
    if (UK.includes(country as AllowedCountry)) applicableRateNames = rateNames.uk
    else if (EU.includes(country as AllowedCountry)) applicableRateNames = rateNames.eu

    // Fetch list of active shipping rates
    const rates = await stripe.shippingRates.list({active: true})
    // Find rates with descriptions in the applicable array
    console.log(rates.data.map(r => r.display_name))
    const applicableRates = rates.data
        .filter(r => applicableRateNames.includes(r.display_name || ""))
        .slice(0, 5) // Max 5 rates

    const applicableRateIds = applicableRates.map(rate => rate.id)
    console.log("Updating available shipping options with the following rate names/ids")
    console.log(applicableRateNames)
    console.log(applicableRateIds)
    const applicableOptions = applicableRates.map(rate => {return {shipping_rate: rate.id}})
    console.log(applicableOptions as Stripe.Emptyable<Stripe.Checkout.SessionUpdateParams.ShippingOption[]>)
    await stripe.checkout.sessions.update(body.checkoutID, {
        collected_information: {shipping_details: body.shipping_details as any},
        shipping_options: applicableOptions as Stripe.Emptyable<Stripe.Checkout.SessionUpdateParams.ShippingOption[]>
    })
    return new Response(JSON.stringify(applicableRateIds))

} catch (e) {
    console.error(e)
    return new Response(undefined, {status: 500})
}}