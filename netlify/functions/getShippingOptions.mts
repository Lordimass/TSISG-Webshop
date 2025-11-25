import { Context } from "@netlify/functions";
import { stripe } from "../lib/stripeObject.mts";
import {AllowedCountry, EU, UK} from "@shared/consts/shipping.ts";
import {ShippingOptionGroups, validateShippingOptionGroups} from "@shared/schemas/shipping.ts";
import {FromSchema, JSONSchema} from "json-schema-to-ts";
import {ajv} from "@shared/schemas/schemas.ts";

const BodySchema = ({
    type: "object",
    properties: {
        country: {type: "string"}, // Should be AllowedCountry, but this is a Stripe type.
        checkoutID: {type: "string"},
    },
    required: ["country", "checkoutID"]
}) as const satisfies JSONSchema;
type Body = FromSchema<typeof BodySchema>;
const validateBody = ajv.compile(BodySchema);

let rates: ShippingOptionGroups = JSON.parse(process.env.VITE_SHIPPING_OPTION_GROUPS ?? "{}")

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
    if (!validateShippingOptionGroups(rates)) {
        console.error(
            `VITE_SHIPPING_OPTION_GROUPS is malformed: ${JSON.stringify(rates, undefined, 2)}`
        )
        return new Response("VITE_SHIPPING_OPTION_GROUPS is malformed", {status: 400})
    }

    let applicableRates = rates.world
    if (UK.includes(body.country as AllowedCountry)) applicableRates = rates.uk
    else if (EU.includes(body.country as AllowedCountry)) applicableRates = rates.eu
    console.log(applicableRates)

    // Fetch list of active shipping rates
    // Find rates with descriptions in the applicable array
    // Find shipping rates for the given country
    // Update checkout session

    await stripe.checkout.sessions.update(body.checkoutID, {
        shipping_options: applicableRates.map(rate => {return {shipping_rate: rate}})
    })

    return new Response(JSON.stringify(applicableRates))

} catch (e) {
    console.error(e)
    return new Response(undefined, {status: 500})
}}