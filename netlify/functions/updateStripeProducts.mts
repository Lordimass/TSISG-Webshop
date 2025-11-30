import {Context} from "@netlify/functions";
import type {ProductData, RawProductData, WebhookPayload} from "@shared/types/supabaseTypes.ts";
import {VALIDATORS} from "@shared/schemas/schemas.ts";
import {NetlifyFunctionError} from "@shared/errors.ts";
import {supabaseAnon} from "../lib/getSupabaseClient.ts";
import {stripe} from "../lib/stripeObject.ts";
import Stripe from "stripe";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {generateStripeCurrencyOptions, getImageURL} from "../lib/lib.ts";
import {supabase} from "../../src/lib/supabaseRPC.tsx";
import {ConversionRates} from "@shared/functions/price.ts";

/**
 * Sync saved Stripe Product data with Supabase
 *
 * When run without a body, updates all Stripe products to match Supabase, otherwise just updates based on the change
 * reported by the body. Must be in `WebhookPayload` format
 *
 * This function is primarily designed to be called by a Supabase Webhook.
 * For local development, use Cloudflared tunnel or similar with `cloudflared tunnel run`.
 *
 * ---
 * # Query String Parameters
 * Specify `archiveAllOldPrices` query string parameter to request that all old Stripe prices are archived, instead of
 * just the current default. This isn't done by default to save on API calls and resources since it shouldn't be
 * necessary more than once.
 *
 * Specify `sku` as a Supabase product SKU to request that a specific SKU be updated. This only works if the body is
 * empty and the request is local (i.e. running in Netlify Local Development Environment). This is only designed to be
 * used in development and is not an available option in production.
 *
 * @endpoint POST /.netlify/functions/updateStripeProducts
 * @see [Supabase Documentation](https://supabase.com/docs/guides/database/webhooks)
 * @see [Webhook Configuration](https://supabase.com/dashboard/project/iumlpfiybqlkwoscrjzt/integrations/webhooks/webhooks)
 * @see WebhookPayload
 */
export default async function handler(request: Request, context: Context): Promise<Response> { try {
    // Check form of request
    if (request.method !== "POST" && request.method !== "GET") {
        console.error(`Method ${request.method} not allowed`)
        return new Response(`Method ${request.method} not allowed`, {status: 405});
    } else if (request.headers.get("Content-Type") !== "application/json" && request.method == "POST") {
        console.error("'Content-Type' must be 'application/json'")
        return new Response("'Content-Type' must be 'application/json'", {status: 412})
    }

    // Authorise request.
    // Key is static so this isn't a hard and fast check, should still be careful with request contents.
    if (request.headers.get("Authorization") != `Bearer ${process.env.SUPABASE_WEBHOOK_SIGNING_SECRET}`) {
        return new Response(undefined, {status: 403})
    }

    // Check if request was called locally.
    // Locally, this function can be run to update products without need for a change to the products table.
    let local = context.ip === "::1"

    const body = await request.json()
    const searchParams = new URL(request.url).searchParams
    const archiveAllOldPrices = searchParams.has("archiveAllOldPrices")
    let payload // Supabase Webhook Payload (If this is a webhook request)
    switch (body.type) {
        case "INSERT": // Add a new product on Stripe
            payload = await processBody(request);
            await handleInsertCase(payload.record)
            break;
        case "UPDATE": // Update product data on Stripe
            payload = await processBody(request);
            await handleUpdateCase(payload.record, archiveAllOldPrices)
            break;
        case "DELETE": // Remove a product from Stripe
            payload = await processBody(request);
            await handleDeleteCase(payload.old_record);
            break;
        default: // Payload not from Supabase, if local, ignore this and update the product from query string.
            if (local && searchParams.has("sku")) {
                // TODO: Handle deleting old products on Stripe too.
                const sku = Number(searchParams.get("sku")!);
                if (!Number.isNaN(Number(sku))) {
                    // Local request means the body contains exchange rates
                    await updateFromSku(
                        sku,
                        searchParams.has("archiveAllOldPrices"),
                        body
                    )
                }
            } else if (local) {
                return new Response(
                    "Local request and no body provided, but no `sku` query string parameter was provided.",
                    {status: 400}
                );
            } else {
                return new Response(
                    "Invalid Payload",
                    {status: 400}
                )
            }
            break;
    }

    return new Response(undefined)

} catch(error: unknown) {
    if (VALIDATORS.NetlifyFunctionError(error)) {
        const netlifyFunctionError = error as NetlifyFunctionError;
        return new Response(netlifyFunctionError.message, {status: netlifyFunctionError.status});
    } else {
        console.error(error)
        return new Response(undefined, {status: 500})
    }
}}

/**
 * Validate the body of the request and return a typed version of the body.
 */
async function processBody(body: any): Promise<WebhookPayload> {
    if (!VALIDATORS.WebhookPayload(body)) {
        throw new NetlifyFunctionError("Request body malformed", 400);
    }
    return body as WebhookPayload;
}

/**
 * Fetch the Stripe product that matches a given SKU on Supabase.
 * @param supabaseSKU The SKU of the product to find a match for.
 * @return The Stripe product, or undefined if no product was able to be found.
 */
export async function fetchStripeProduct(supabaseSKU: number): Promise<Stripe.Product | undefined> {
    // Try to find product by URL first
    const prods = await stripe
        .products
        .list({url: `https://thisshopissogay.com/products/${supabaseSKU}`, active: true})
    if (prods.data.length > 0) {return prods.data[0]}

    // Products which are running on the outdated per-checkout update flow may not have a URL set. Fetch all products
    // and filter for metadata.sku match.
    const skuSearchProds = (await stripe
        .products
        .list({active: true}))
        .data.filter(prod => prod.metadata.sku === ""+supabaseSKU);
    return skuSearchProds[0]
    // Note that this still may find nothing if the product actually doesn't exist, in which case undefined is returned.
}

/**
 * Update a product on Stripe with the data from the given Supabase product.
 * @param stripeProduct The product to update on Stripe.
 * @param supabaseProduct The data to update the Stripe product with.
 * @param archiveAllOldPrices Whether to archive all the old prices, instead of just the current default, when updating
 * prices.
 * @param cachedExchangeRates Cached conversion rates to prevent having to fetch new ones
 */
async function updateStripeProduct(
    stripeProduct: Stripe.Product,
    supabaseProduct: ProductData,
    archiveAllOldPrices = false,
    cachedExchangeRates?: ConversionRates
) {
    console.log(`Updating ${supabaseProduct.name} on Stripe...`)

    // Update price data for the product
    const unit_amount = Math.round(supabaseProduct.price*100)
    const lookup_key = `${supabaseProduct.sku}_${supabaseProduct.name}`
    const currency_options = await generateStripeCurrencyOptions(
        Math.round(supabaseProduct.price*100),
        "PRODUCT",
        undefined,
        cachedExchangeRates
    )
    process.stdout.write("Updating Stripe price data - Saving new price data... ")
    const newPrice = await stripe.prices.create({ // Create new price
        product: stripeProduct.id,
        currency: "gbp",
        tax_behavior: "inclusive",
        unit_amount,
        currency_options,
        lookup_key,
        transfer_lookup_key: true
    })
    process.stdout.write("\r\x1b[K") // Clear line
    process.stdout.write("Updated Stripe price data, updating other data... ")

    // Update all other data for the product
    const imageURL = getImageURL(supabaseProduct.images[0])
    await stripe.products.update(stripeProduct.id, {
        description: supabaseProduct.description,
        name: supabaseProduct.name,
        images: imageURL ? [imageURL] : [],
        metadata: {
            category_id: supabaseProduct.category.id,
            category: supabaseProduct.category.name,
            sku: supabaseProduct.sku
        },
        url: `https://thisshopissogay.com/products/${supabaseProduct.sku}`,
        default_price: newPrice.id // Set default price to the newly created one
    })

    // Deactivate old price(s)
    if (archiveAllOldPrices) {
        process.stdout.write("\r\x1b[K") // Clear line
        process.stdout.write("Updated Stripe product data, archiving all old prices... ")
        // Archive all prices other than the one we just set
        const prices = await stripe.prices.list({product: stripeProduct.id})
        for (const price of prices.data) {
            if (price.id === newPrice.id) {continue}
            process.stdout.write("\r\x1b[K") // Clear line
            process.stdout.write(`Updated Stripe product data, archiving old price: ${price.id}... `)
            await stripe.prices.update(price.id, {active: false})
        }

    } else {
        process.stdout.write("\r\x1b[K") // Clear line
        process.stdout.write("Updated Stripe product data, archiving old price... ")
        // Just deactive the last default price.
        // Note that stripeProduct.default_price is locally still set to the OLD default price, not the one we just set.
        await stripe.prices.update(stripeProduct.default_price as string, {active: false})
    }
    process.stdout.write("\r\x1b[K") // Clear line
}

/**
 * Create a new product on Stripe with the data from the given Supabase product.
 * @param supabaseProduct The data to create the new Stripe product to match.
 * @param cachedExchangeRates Cached conversion rates to prevent having to fetch new ones.
 */
async function createStripeProduct(supabaseProduct: ProductData, cachedExchangeRates?: ConversionRates) {
    console.log(`Creating new Stripe product for ${supabaseProduct.name}`);
    // Update price data for the product
    const unit_amount = Math.round(supabaseProduct.price*100)
    const lookup_key = `${supabaseProduct.sku}_${supabaseProduct.name}`
    const currency_options = await generateStripeCurrencyOptions(
        Math.round(supabaseProduct.price*100),
        "PRODUCT",
        undefined,
        cachedExchangeRates
    )

    process.stdout.write("Creating Stripe product... ")
    // Create product
    const imageURL = getImageURL(supabaseProduct.images[0])
    const newProd = await stripe.products.create({
        description: supabaseProduct.description ?? undefined,
        name: supabaseProduct.name,
        images: imageURL ? [imageURL] : [],
        metadata: {
            category_id: supabaseProduct.category.id,
            category: supabaseProduct.category.name,
            sku: supabaseProduct.sku
        },
        url: `https://thisshopissogay.com/products/${supabaseProduct.sku}`,
        default_price_data: { // Create new price
            currency: "gbp",
            tax_behavior: "inclusive",
            unit_amount,
            currency_options,
        }
    })

    process.stdout.write("\r\x1b[K") // Clear line
    process.stdout.write("Updating price lookup key... ")
    // Update lookup key for the newly created price
    await stripe.prices.update(newProd.default_price as string, {
        lookup_key, transfer_lookup_key: true
    })
    process.stdout.write("\r\x1b[K") // Clear line
}

/** Handle insertion of a new product record .
 * @param prod The new product record */
async function handleInsertCase(prod: RawProductData) {
    const supabaseProd = await getProducts(supabaseAnon, [prod.sku]);
    await createStripeProduct(supabaseProd[0]);
}

/** Handle deletion of a product record.
 * @param prod The contents of the record prior to deletion
 */
async function handleDeleteCase(prod: RawProductData) {
    const stripeProd = await fetchStripeProduct(prod.sku)
    if (stripeProd) {
        await stripe.products.update(stripeProd.id, {active: false})
    }
}

/** Handle updating an existing product record.
 * @param prod The new product record.
 * @param archiveAllOldPrices Whether to archive all the old prices, instead of just the current default, when updating
 * prices.
 */
async function handleUpdateCase(prod: RawProductData, archiveAllOldPrices = false) {
    const supabaseProds = await getProducts(supabaseAnon, [prod.sku]);
    const stripeProd = await fetchStripeProduct(prod.sku)
    if (stripeProd && supabaseProds.length > 0) {
        await updateStripeProduct(stripeProd, supabaseProds[0], archiveAllOldPrices)
    }
}

/**
 * Update to product on Stripe from only a Supabase SKU. If no Stripe product exists, create one.
 * @param sku
 * @param archiveAllOldPrices
 * @param cachedExchangeRates
 */
async function updateFromSku(sku: number, archiveAllOldPrices = false, cachedExchangeRates?: ConversionRates) {
    const supabaseProds = await getProducts(supabaseAnon, [sku]);
    const stripeProd = await fetchStripeProduct(sku);
    if (stripeProd && supabaseProds.length > 0) {
        await updateStripeProduct(stripeProd, supabaseProds[0], archiveAllOldPrices, cachedExchangeRates)
    } else if (supabaseProds.length > 0) {
        await createStripeProduct(supabaseProds[0], cachedExchangeRates)
    }
}