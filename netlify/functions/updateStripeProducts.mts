import {Context} from "@netlify/functions";
import type {RawProductData, WebhookPayload} from "@shared/types/supabaseTypes.ts";
import {VALIDATORS} from "@shared/schemas/schemas.ts";
import {NetlifyFunctionError} from "@shared/errors.ts";
import {supabaseAnon} from "../lib/getSupabaseClient.mts";
import {stripe} from "../lib/stripeObject.mts";
import Stripe from "stripe";
import {strip} from "ts-json-schema-generator";

/**
 * Sync saved Stripe Product data with Supabase
 *
 * When run without a body, updates all Stripe products to match Supabase, otherwise just updates based on the change
 * reported by the body. Must be in `WebhookPayload` format
 *
 * This function is primarily designed to be called by a Supabase Webhook.
 * For local development, use Cloudflared tunnel or similar with `cloudflared tunnel run`.
 *
 * @see [Supabase Documentation](https://supabase.com/docs/guides/database/webhooks)
 * @see [Webhook Configuration](https://supabase.com/dashboard/project/iumlpfiybqlkwoscrjzt/integrations/webhooks/webhooks)
 * @see WebhookPayload
 */
export default async function handler(request: Request, _context: Context): Promise<Response> { try {
    // Check form of request
    if (request.method !== "POST" && request.method !== "GET") {
        console.error(`Method ${request.method} not allowed`)
        return new Response(`Method ${request.method} not allowed`, {status: 405});
    } else if (request.headers.get("Content-Type") !== "application/json" && request.method == "POST") {
        console.error("'Content-Type' must be 'application/json'")
        return new Response("'Content-Type' must be 'application/json'", {status: 412})
    }
    const payload = await getBody(request);
    console.log(JSON.stringify(payload, undefined, 2));
    switch (payload?.type) {
        case "INSERT": // Add a new product on Stripe
            break;
        case "UPDATE": // Update product data on Stripe
            break;
        case "DELETE": // Remove a product from Stripe
            break;
        default: // No payload, update all products
            break;
    }


    return new Response(undefined)
} catch(error: unknown) {
    if (VALIDATORS.NetlifyFunctionError(error)) {
        const netlifyFunctionError = error as NetlifyFunctionError;
        return new Response(netlifyFunctionError.message, {status: netlifyFunctionError.status});
    } else {
        return new Response(undefined, {status: 500})
    }
}}

/**
 * Extract the body of the request if it exists
 */
async function getBody(request: Request): Promise<WebhookPayload | undefined> {
    let webhookPayload: WebhookPayload;
    const bodyText = await request.text() // Have to get text first since Supabase doesn't update bodyUsed param.
    if (bodyText) {
        const body: unknown = JSON.parse(bodyText)
        if (!VALIDATORS.WebhookPayload(body)) {
            throw new NetlifyFunctionError("Request body malformed", 400);
        }
        webhookPayload = body as WebhookPayload;
        return webhookPayload;
    }
}

/** Fetch raw product data from Supabase.
 * @returns An array of objects containing raw, unmodified product data from Supabase.
 * @see RawProductData
 */
async function fetchRawSupabaseProducts(): Promise<RawProductData[]> {
    const {data, error} = await supabaseAnon
        .from("products")
        .select("*")
    if (error) {throw new NetlifyFunctionError(error.message, 500)}
    if (data.length > 0 && !VALIDATORS.RawProductData(data[0])) {
        throw new NetlifyFunctionError(
            "Data fetched from Supabase Products table is not in the expected form",
            500
        )
    }
    return data as RawProductData[]
}

/** Fetch active product data from Stripe.
 * @returns An array of objects containing all active products on Stripe.
 */
async function fetchActiveStripeProducts() {
    const prods: Stripe.Product[] = []
    await stripe
        .products
        .list({active: true})
        .autoPagingEach((prod) => {prods.push(prod)})
    return prods;
}

/** Update all products on Stripe based on all the products on Supabase */
async function updateAllProducts() {
    // Fetch current products from Supabase & Stripe.
    const supabaseProds = await fetchRawSupabaseProducts();
    const stripeProds = await fetchActiveStripeProducts();

    // For each Stripe product, try to find a matching Supabase product to update information from.
    for (const stripeProd of stripeProds) {
        // If there's no associated metadata, the Stripe product is malformed and should be de-activated.
        if (!stripeProd.metadata.sku) {await stripe.products.update(stripeProd.id, {active: false})}
        // Search for matches
        const matchedSupabaseProds = supabaseProds.filter(
            supabaseProd => ""+supabaseProd.sku === stripeProd.metadata.sku)
        // If a match is found, update Stripe and remove the product from the list of Supabase products
        if (matchedSupabaseProds.length === 1) {

        }
        // If no match is found, disable this Stripe Product
        else if (matchedSupabaseProds.length === 0) {

        }
        // If more than one match was found, multiple products have the same SKU (which is a problem)
        else {
            console.error(`Multiple products found on Supabase with SKU ${stripeProd.metadata.sku}`)
        }
    }


    // For each remaining Supabase product, create a new Stripe product since we know it doesn't exist yet.
}

async function handleInsertCase(prod: RawProductData) {

}

async function handleDeleteCase(prod: RawProductData) {

}

async function handleUpdateCase(prod: RawProductData, oldProd: RawProductData) {

}