import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabaseAnon} from "../netlify/lib/getSupabaseClient.ts";
import Stripe from "stripe";
import {parseArgs} from "node:util";
import dotenv from "dotenv";
import cliProgress from "cli-progress";
import {stripe} from "../netlify/lib/stripeObject.ts";
import {fetchExchangeRates} from "@shared/functions/price.ts";
dotenv.config({path: ".env.netlify"});
dotenv.config({path: ".env", override: true});

/**
 * Update data on Stripe to match with Supabase. Archives products on Stripe that have no currently active Supabase
 * product, creates new Stripe products where there was no existing product, and modifies existing products where
 * they already exist, ensuring they match perfectly with Supabase.
 *
 * Must be run in conjunction with `netlify dev` to ensure serverside functions are running because this script
 * piggybacks off of `/netlify/functions/updateStripeProducts.mts`
 */

const updatingMsg = "Updating Existing Stripe Products"
const creatingMsg = "Creating New Stripe Products"

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
 * Call the Netlify function to update the stripe product in relation to a Supabase SKU.
 * @param sku The SKU of the product on Supabase.
 * @param name The human-readable name of the product.
 */
async function updateStripeProduct(sku: number, name: string) {
    const updateEndpoint = new URL(endpoint)
    updateEndpoint.searchParams.set("sku", ""+sku)
    const resp = await fetch(updateEndpoint, {
        headers: {
            "Authorization": `Bearer ${process.env.SUPABASE_WEBHOOK_SIGNING_SECRET}`,
            "Content-Type": "application/json"
        },
        method: "POST",
        body: exchangeRatesString
    })
    const body = await resp.text();
    if (!resp.ok) {
        console.log(`\n[${resp.status}: ${resp.statusText}] ${body ?? ""}\n`);
    }
}

console.log("Syncing Supabase Products -> Stripe");

// Process command arguments
const args = parseArgs({options: {
        port: {type: "string", short: 'p', default: "8888"},
        netlifyFunction: {type: "string", short: 'f', default: "updateStripeProducts"},
        archiveAllOldPrices: {type: "boolean", default: false},
    }}).values
const endpoint = new URL(`http://localhost:${args.port}/.netlify/functions/${args.netlifyFunction}`)
endpoint.searchParams.set("archiveAllOldPrices", ""+args.archiveAllOldPrices)

// Fetch current products from Supabase & Stripe.
let supabaseProds = await getProducts(supabaseAnon);
const stripeProds = await fetchActiveStripeProducts();

// Cache exchange rates to save time fetching them for every update.
const exchangeRatesString = JSON.stringify(await fetchExchangeRates("GBP"))

// Render progress bar in CLI
const prog = new cliProgress.MultiBar({
    clearOnComplete: false,
    hideCursor: true,
    format: ` {bar} | {name} | {value} / {total} ({percentage}%) | ETA: {eta_formatted} | Duration: {duration_formatted}`
}, cliProgress.Presets.shades_classic);
const updateProgress = prog.create(stripeProds.length, 0, {name: updatingMsg});
const saveProgress = prog.create(supabaseProds.length, 0, {name: creatingMsg});
updateProgress.start(stripeProds.length, 0, {name: updatingMsg});

// For each Stripe product, try to find a matching Supabase product to update information from.
for (const stripeProd of stripeProds) {
    // If there's no associated metadata, the Stripe product is malformed and should be de-activated.
    if (!stripeProd.metadata.sku) {await stripe.products.update(stripeProd.id, {active: false})}

    // Search for matches
    const matchedSupabaseProds = supabaseProds.filter(
        supabaseProd => ""+supabaseProd.sku === stripeProd.metadata.sku)
    // If a match is found, update Stripe and remove the product from the list of Supabase products
    if (matchedSupabaseProds.length > 0) {
        await updateStripeProduct(matchedSupabaseProds[0].sku, matchedSupabaseProds[0].name)
        supabaseProds = supabaseProds.filter(p => p.sku !== matchedSupabaseProds[0].sku)
        saveProgress.setTotal(saveProgress.getTotal()-1);
    }
    // If no match is found, disable this Stripe Product
    else if (matchedSupabaseProds.length === 0) {
        await stripe.products.update(stripeProd.id, {active: false})
    }
    updateProgress.increment(undefined, {name: updatingMsg});
}
updateProgress.stop();

saveProgress.start(supabaseProds.length, 0, {name: creatingMsg});
// For each remaining Supabase product, create a new Stripe product since we know it doesn't exist yet.
for (const supabaseProd of supabaseProds) {
    await updateStripeProduct(supabaseProd.sku, supabaseProd.name)
    saveProgress.increment(undefined, {name: creatingMsg});
}
prog.stop()

console.log("Stripe is now in sync with Supabase.")