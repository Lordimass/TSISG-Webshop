import { Context } from "@netlify/functions";
import Stripe from 'stripe'
import { stripe } from "../lib/stripeObject.mts";
import type { ProductInBasket } from "../../shared/types/types.mts";
import type { StripeProductMeta } from "../../shared/types/stripeTypes.mts";
import { checkObjectsEqual, getImageURL } from "../lib/lib.mts";
import { callRPC } from "../lib/supabaseRPC.mts";
import { supabaseAnon } from "../lib/getSupabaseClient.mts";
import type { ImageData } from "../../shared/types/supabaseTypes.mts";

export default async function handler(request: Request, context: Context) {
    console.log(process.env.STRIPE_SECRET_KEY)
    if (!stripe) throw new Error(
        "Stripe client not initialised, check STRIPE_SECRET_KEY environment variable"
    );

    const pricePointIDs: Array<Object> = [];
    const stripeProducts: Array<Stripe.Product> = (await stripe.products.list()).data;

    let basket = await request.json()

    // Verify and update basket data with up to date information
    const priceCheckResp = await updateBasketData(basket, context);
    if (!priceCheckResp.ok) return priceCheckResp
    else basket = await priceCheckResp.json()

    for (let i = 0; i < basket.length; i++) {
        const item: ProductInBasket = basket[i];
        const prodMeta: StripeProductMeta = {
            sku: item.sku,
            category_id: item.category.id,
            category: item.category.name
        }
        let stripeItem: Stripe.Product | null = getProductOnStripe(stripeProducts, item);
        const itemprice = Math.round(item.price*100) // Stripe requires prices in pennies
        
        if (stripeItem) { // If the item already exists on stripe, use it as is.
            const price: Stripe.Price = await stripe.prices.retrieve(stripeItem.default_price as string)
            if (price.unit_amount == itemprice) { // If the price is correct, again use that price as is
                pricePointIDs.push({
                    price: stripeItem.default_price as string, 
                    quantity: item.basketQuantity
                })
            } else { // Price was changed since last, create a new price
                const price = await stripe.prices.create({
                    currency: "gbp",
                    unit_amount: itemprice, 
                    product: stripeItem.id
                })
                pricePointIDs.push({
                    price: price.id,
                    quantity: item.basketQuantity
                })
                // Update the default price object to be this new price.
                try {
                    await stripe.products.update(stripeItem.id, {default_price: price.id})
                } catch (error) {
                    console.error("Error updating product default price:", error);
                    return new Response(undefined, {status: 500});
                }
            }

            // Update other metadata if any has changed
            if (!checkObjectsEqual(stripeItem.metadata as unknown as StripeProductMeta, prodMeta)) {
                try {
                    await stripe.products.update(stripeItem.id, {metadata: prodMeta})
                } catch (error) {
                    console.warn("Failed to update product metadata:", error)
                }
            }

        } else { // If it doesn't already exist, we'll need to create it.
            try {
                const productData = {
                    name: item.name,
                    images: getListOfImageURLS(item.images),
                    default_price_data: {
                        currency: 'gbp',
                        unit_amount: itemprice // Stripe requires prices in pennies
                    },
                    metadata: prodMeta
                }
                stripeItem = await stripe.products.create(productData)
                if (stripeItem) { // Add item now that it's been created
                    const priceID = stripeItem.default_price as string
                    pricePointIDs.push({
                        price: priceID, 
                        quantity: item.basketQuantity
                    });
                } else {
                    return new Response(undefined, {status: 502, statusText: "An item failed to create on Stripe"})
                }
            } catch (error) {
                console.error("Error creating product on Stripe:", error);
                return new Response(undefined, {status: 500, statusText: "Internal server error"});
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
    const freshProducts = await callRPC("get_products", {skus: basket.map(p=>p.sku), in_stock_only: false, active_only: false}, supabaseAnon)

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

function getProductOnStripe(
        stripeProducts: Array<Stripe.Product>, 
        product: ProductInBasket
    ): Stripe.Product | null {
    let foundProduct: Stripe.Product | null = null;
    stripeProducts.forEach((stripeProduct) => {
        if (stripeProduct.metadata.sku === product.sku.toString()) {
            foundProduct = stripeProduct
        }
    })
    return foundProduct
}

function getListOfImageURLS(images: ImageData[]) {
    return images.map(img => getImageURL(img)).filter(img => img !== undefined)
}