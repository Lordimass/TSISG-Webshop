import {Context} from "@netlify/functions";
import type {ProductData, RawProductData, WebhookPayload} from "@shared/types/supabaseTypes.ts";
import {VALIDATORS} from "@shared/schemas/schemas.ts";
import {NetlifyFunctionError} from "@shared/errors.ts";
import {supabaseAnon} from "../lib/getSupabaseClient.mts";
import {stripe} from "../lib/stripeObject.mts";
import Stripe from "stripe";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {generateStripeCurrencyOptions, getImageURL} from "../lib/lib.mts";

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
 * @endpoint POST /.netlify/functions/updateStripeProducts
 * @see [Supabase Documentation](https://supabase.com/docs/guides/database/webhooks)
 * @see [Webhook Configuration](https://supabase.com/dashboard/project/iumlpfiybqlkwoscrjzt/integrations/webhooks/webhooks)
 * @see WebhookPayload
 */
export default async function handler(request: Request, _context: Context): Promise<Response> { try {
    // TODO: Figure out how to get round the 30s time out when updating all products. Possibly just run a script locally
    //  since I'll only need to update all products myself so can do it without running through Netlify?

    // Check form of request
    if (request.method !== "POST" && request.method !== "GET") {
        console.error(`Method ${request.method} not allowed`)
        return new Response(`Method ${request.method} not allowed`, {status: 405});
    } else if (request.headers.get("Content-Type") !== "application/json" && request.method == "POST") {
        console.error("'Content-Type' must be 'application/json'")
        return new Response("'Content-Type' must be 'application/json'", {status: 412})
    }
    const payload = await getBody(request);
    const searchParams = new URL(request.url).searchParams
    switch (payload?.type) {
        case "INSERT": // Add a new product on Stripe
            await handleInsertCase(payload.record)
            break;
        case "UPDATE": // Update product data on Stripe
            await handleUpdateCase(payload.record)
            break;
        case "DELETE": // Remove a product from Stripe
            await handleDeleteCase(payload.old_record);
            break;
        default: // No payload, update all products
            await updateAllProducts();
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

/**
 * Fetch the Stripe product that matches a given SKU on Supabase.
 * @param supabaseSKU The SKU of the product to find a match for.
 * @return The Stripe product, or undefined if no product was able to be found.
 */
async function fetchStripeProduct(supabaseSKU: number): Promise<Stripe.Product | undefined> {
    // Try to find product by URL first
    const prods = await stripe
        .products
        .list({url: `https://thisshopissogay.com/products/${supabaseSKU}`})
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
 */
async function updateStripeProduct(
    stripeProduct: Stripe.Product,
    supabaseProduct: ProductData,
    archiveAllOldPrices = false
) {
    console.log(`Updating ${supabaseProduct.name} on Stripe...`)

    // Update price data for the product
    const unit_amount = Math.round(supabaseProduct.price*100)
    const lookup_key = `${supabaseProduct.sku}_${supabaseProduct.name}`
    const currency_options = await generateStripeCurrencyOptions(
        Math.round(supabaseProduct.price*100),
        "PRODUCT"
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
        metadata: {category_id: supabaseProduct.category.id, category: supabaseProduct.category.name},
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
 */
async function createStripeProduct(supabaseProduct: ProductData) {
    console.log(`Creating new Stripe product for ${supabaseProduct.name}`);
    // Update price data for the product
    const unit_amount = Math.round(supabaseProduct.price*100)
    const lookup_key = `${supabaseProduct.sku}_${supabaseProduct.name}`
    const currency_options = await generateStripeCurrencyOptions(
        Math.round(supabaseProduct.price*100),
        "PRODUCT"
    )

    process.stdout.write("Creating Stripe product... ")
    // Create product
    const imageURL = getImageURL(supabaseProduct.images[0])
    const newProd = await stripe.products.create({
        description: supabaseProduct.description ?? undefined,
        name: supabaseProduct.name,
        images: imageURL ? [imageURL] : [],
        metadata: {category_id: supabaseProduct.category.id, category: supabaseProduct.category.name},
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

/**
 * Update all products on Stripe based on all the products on Supabase
 * @param archiveAllOldPrices Whether to archive all the old prices, instead of just the current default, when updating
 * prices.
 */
async function updateAllProducts(archiveAllOldPrices = false) {
    // Fetch current products from Supabase & Stripe.
    const supabaseProds = await getProducts(supabaseAnon);
    const stripeProds = await fetchActiveStripeProducts();

    // For each Stripe product, try to find a matching Supabase product to update information from.
    for (const stripeProd of stripeProds) {
        // If there's no associated metadata, the Stripe product is malformed and should be de-activated.
        if (!stripeProd.metadata.sku) {await stripe.products.update(stripeProd.id, {active: false})}

        // Search for matches
        const matchedSupabaseProds = supabaseProds.filter(
            supabaseProd => ""+supabaseProd.sku === stripeProd.metadata.sku)
        // If a match is found, update Stripe and remove the product from the list of Supabase products
        if (matchedSupabaseProds.length > 0) {
            await updateStripeProduct(stripeProd, matchedSupabaseProds[0], archiveAllOldPrices)
            supabaseProds.filter(p => p.sku !== matchedSupabaseProds[0].sku)
        }
        // If no match is found, disable this Stripe Product
        else if (matchedSupabaseProds.length === 0) {
            await stripe.products.update(stripeProd.id, {active: false})
        }
    }

    // For each remaining Supabase product, create a new Stripe product since we know it doesn't exist yet.
    for (const supabaseProd of supabaseProds) {
        await createStripeProduct(supabaseProd);
    }
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
    if (stripeProd) {
        await updateStripeProduct(stripeProd, supabaseProds[0], archiveAllOldPrices)
    }
}