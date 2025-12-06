import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config({path: ".env.netlify"});

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY does not exist!")
} 
export let stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-08-27.basil'
});

/**
 * Fetch the Stripe product that matches a given SKU on Supabase.
 * @param supabaseSKU The SKU of the product to find a match for.
 * @param stripeProds If you already have a list of Stripe products, pass them here to avoid potentially having to
 * fetch a fresh list.
 * @param stripeObj Stripe object to fetch from if `stripeProds` not supplied and the default Stripe object is not wanted.
 * @return The Stripe product, or undefined if no product was able to be found.
 */
export async function fetchStripeProduct(
    supabaseSKU: number,
    stripeProds?: Stripe.Product[],
    stripeObj?: Stripe
): Promise<Stripe.Product | undefined> {
    // If stripeProds was provided, no need to do an API call
    if (stripeProds) {
        const prods = stripeProds.filter(stripeProd => stripeProd.metadata.sku === ""+supabaseSKU);
        if (prods.length > 0) {
            return prods[0];
        }
        // If no match found in this list, resort to other methods
    }
    const chosenStripe = stripeObj || stripe
    // Try to find product by URL first
    const prods = await chosenStripe
        .products
        .list({url: `https://thisshopissogay.com/products/${supabaseSKU}`, active: true})
    if (prods.data.length > 0) {return prods.data[0]}

    // Products which are running on the outdated per-checkout update flow may not have a URL set. Fetch all products
    // and filter for metadata.sku match.
    const skuSearchProds = (await chosenStripe
        .products
        .list({active: true}))
        .data.filter(prod => prod.metadata.sku === ""+supabaseSKU);
    return skuSearchProds[0]
    // Note that this still may find nothing if the product actually doesn't exist, in which case undefined is returned.
}