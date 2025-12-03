import { Context } from "@netlify/functions";
import { stripe } from "../lib/stripe.ts";
import {AllowedCountry, EU, UK} from "@shared/consts/shipping.ts";
import {FromSchema, JSONSchema} from "json-schema-to-ts";
import {ajv, VALIDATORS} from "@shared/schemas/schemas.ts";
import {ShippingOptionGroups} from "@shared/types/shipping.ts";

const BodySchema = ({
    type: "object",
    properties: {
        // Should be AllowedCountry, but this is a Stripe type so can't go here without generating a Schema for it
        country: {type: "string"},
        checkoutID: {type: "string"},
    },
    required: ["country", "checkoutID"]
}) as const satisfies JSONSchema;
type Body = FromSchema<typeof BodySchema>;
const validateBody = ajv.compile(BodySchema);

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
    if (!validateBody(body)) {
        console.error(`Request body was malformed: ${body}`)
        return new Response("Request body is malformed", {status: 400})
    } 

    // Validate form of `rates`
    if (!VALIDATORS.ShippingOptionGroups(untypedRates)) {
        console.error(
            `VITE_SHIPPING_RATES is malformed: ${JSON.stringify(untypedRates, undefined, 2)}`
        )
        return new Response("VITE_SHIPPING_RATES is malformed", {status: 400})
    }
    const rateNames = untypedRates as ShippingOptionGroups;

    let applicableRateNames = rateNames.world
    if (UK.includes(body.country as AllowedCountry)) applicableRateNames = rateNames.uk
    else if (EU.includes(body.country as AllowedCountry)) applicableRateNames = rateNames.eu


    // Fetch list of active shipping rates
    const rates = await stripe.shippingRates.list({active: true})
    // Find rates with descriptions in the applicable array
    console.log(rates.data.map(r => r.display_name))
    const applicableRates = rates.data.filter(r => applicableRateNames.includes(r.display_name || ""))
    // Update checkout session
    await stripe.checkout.sessions.update(body.checkoutID, {
        shipping_options: applicableRates.map(rate => {return {shipping_rate: rate.id}})
    })
    const applicableRateIds = applicableRates.map(rate => rate.id)
    console.log(applicableRateNames)
    console.log(applicableRateIds)
    return new Response(JSON.stringify(applicableRateIds))

} catch (e) {
    console.error(e)
    return new Response(undefined, {status: 500})
}}