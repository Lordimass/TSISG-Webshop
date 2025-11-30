import { Context } from "@netlify/functions";
import Stripe from 'stripe'
import { stripe } from "../lib/stripeObject.ts";
import type { ProductInBasket } from "@shared/types/types.ts";
import type { StripeProductMeta } from "@shared/types/stripeTypes.ts";
import { checkObjectsEqual, getImageURL } from "../lib/lib.ts";
import { supabaseAnon } from "../lib/getSupabaseClient.ts";
import type { ImageData } from "@shared/types/supabaseTypes.ts";
import DineroFactory, {Currency} from "dinero.js";
import {DEFAULT_CURRENCY} from "../../src/localeHandler.ts";
import {convertDinero} from "@shared/functions/price.ts";
import {callRPC} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../src/lib/supabaseRPC.tsx";

type CurrencyOptions = {[key: string]: {unit_amount: number, tax_behavior: 'exclusive' | 'inclusive' | 'unspecified'}};
type LineItem = (Stripe.LineItem | {price: string})

interface Body {
    basket: ProductInBasket[];
    currency: Currency;
}

// TODO: Instead of constructing products and prices for every user every time they open the checkout,
//  use a webhook which updates the Stripe catalogue every time a change is made to the products, and
//  once daily to ensure conversion rates are kept up to date.
export default async function handler(request: Request, context: Context) {
    console.log(process.env.STRIPE_SECRET_KEY)
    if (!stripe) throw new Error(
        "Stripe client not initialised, check STRIPE_SECRET_KEY environment variable"
    );

    let {basket, currency} = await request.json() as Body

    // Verify and update basket data with up-to-date information
    const priceCheckResp = await updateBasketData(basket, context);
    if (!priceCheckResp.ok) return priceCheckResp
    else basket = await priceCheckResp.json()

    // Iterate through each item in the validated basket and fetch a Stripe Price Point ID
    const pricePointIDs: LineItem[] = [];
    const stripeProducts: Array<Stripe.Product> = (await stripe.products.list({active: true})).data;
    for (const p of basket) {
        /** The metadata that should be attached to this product on Stripe. */
        const prodMeta: StripeProductMeta = {
            sku: p.sku,
            category_id: p.category.id,
            category: p.category.name
        }
        // Construct a Dinero object to calculate the price in the correct currency
        const dinero = DineroFactory({
            amount: Math.round(p.price*100), currency: DEFAULT_CURRENCY, precision: 2
        })
        const convDin = await convertDinero(dinero, currency)
        const currency_options: CurrencyOptions = {}
        if (currency !== DEFAULT_CURRENCY) {
            currency_options[currency.toLowerCase()] = {unit_amount: convDin.getAmount(), tax_behavior: "unspecified"};
        }

        // Check if the product exists on Stripe
        const stripeItem = getProductOnStripe(stripeProducts, p);
        if (stripeItem) {
            // The item does exist, so we can use it.
            // Fetch the prices for the item and check if the one we're looking for exists.
            const prices = (await stripe.prices.list({product: stripeItem.id, active: true})).data;
            const price: Stripe.Price | undefined = prices.filter(sPrice => {
                    return sPrice.unit_amount === dinero.getAmount() &&
                        sPrice.currency === dinero.getCurrency().toLowerCase()
                }
            )[0];

            // Add the price point ID to the array.
            if (price) {
                // Update the currency options to ensure there's an up-to-date price for this product displayed.
                await stripe.prices.update(price.id, {currency_options})
                // The price exists already in the given currency with the right amount.
                pricePointIDs.push({price: price.id, quantity: p.basketQuantity});
            } else {
                // Price did not already exist, so we'll create it.
                const price = await stripe.prices.create({
                    currency: dinero.getCurrency(),
                    unit_amount: dinero.getAmount(),
                    product: stripeItem.id,
                    currency_options
                })
                console.log(price)
                pricePointIDs.push({price: price.id, quantity: p.basketQuantity})
            }

            // Update any other product metadata that may have changed
            if (!checkObjectsEqual(stripeItem.metadata as unknown as StripeProductMeta, prodMeta)) {
                try {await stripe.products.update(stripeItem.id, {metadata: prodMeta})}
                catch (error) {console.warn("Failed to update product metadata:", error)}
            }
        } else {
            // The item does not yet exist, so we must try to create it.
            try {
                // Create the product
                const productData: Stripe.ProductCreateParams = {
                    name: p.name,
                    images: getListOfImageURLS(p.images),
                    // Default used here as it provides a shortcut to create the price in one API call, the fact
                    // that it's a default isn't relevant to functionality in any way.
                    default_price_data: {
                        currency: dinero.getCurrency(),
                        unit_amount: dinero.getAmount(),
                        currency_options
                    },
                    metadata: prodMeta
                }
                const stripeItem = await stripe.products.create(productData)
                // Add price point ID to the list
                pricePointIDs.push({
                    price: stripeItem.default_price as string,
                    quantity: p.basketQuantity
                });

            } catch (error) {
                console.error("Error creating product on Stripe:", error);
                return new Response(undefined, {status: 500});
            }
        }
    }

    return new Response(JSON.stringify({pricePointIDs, basket}), {status: 200})
}

/**
 * Update price and images information to make sure it matches the database and hasn't been tampered with
 * 
 * This has to be done as part of the stripe prices fetch flow to ensure there's no possibility for bad
 * actors to tamper with the basket before its sent to this function
*/ 
async function updateBasketData(basket: ProductInBasket[], _context: Context) {
    // Fetch products
    const freshProducts = await callRPC("get_products", supabaseAnon, {skus: basket.map(p=>p.sku), in_stock_only: false, active_only: false})

    // Check and ammend prices 
    for (let i=0; i<basket.length; i++) {
        const basketItem = basket[i]
        for (let j=0; j<freshProducts.length; j++) {
            const dataItem = freshProducts[i]
            if (dataItem.sku == basketItem.sku) {
                basketItem.price = dataItem.price
                basketItem.images = dataItem.images
            }
        }
    }
    
    return new Response(JSON.stringify(basket), {status: 200})
}

/**
 * Find the Stripe product that matches the given `ProductInBasket` from a list of Stripe products
 * @param stripeProducts The list of `Stripe.Product`s to search for the product in.
 * @param p The product to search for.
 * @return A `Stripe.Product` object, or `undefined` if it cannot be found.
 */
function getProductOnStripe(
        stripeProducts: Array<Stripe.Product>, 
        p: ProductInBasket
    ): Stripe.Product | undefined {
    return stripeProducts.filter(sp => sp.metadata.sku === p.sku.toString())[0]
}

/**
 * Construct a list of image URL strings in relation to a list of `ImageData` objects, filtering out any garbage
 * URLs.
 * @param images The list of `ImageData` objects from which to construct the URLs
 * @return A list of URLs pointing to images.
 * @see ImageData
 * @see getImageURL
 */
function getListOfImageURLS(images: ImageData[]) {
    return images.map(img => getImageURL(img)).filter(img => img !== undefined)
}