import { Context } from "@netlify/functions";
import Stripe from 'stripe'
import {fetchStripeProduct, stripe} from "../lib/stripe.ts";
import type { ProductInBasket } from "@shared/types/types.ts";
import { supabaseAnon } from "../lib/getSupabaseClient.ts";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {StatusedError} from "@shared/errors.ts";

type LineItem = (Stripe.LineItem | {price: string})

interface Body {
    basket: ProductInBasket[];
}

export default async function handler(request: Request, context: Context) {
    console.log(process.env.STRIPE_SECRET_KEY)
    if (!stripe) throw new Error(
        "Stripe client not initialised, check STRIPE_SECRET_KEY environment variable"
    );

    let {basket} = await request.json() as Body

    // Verify and update basket data with up-to-date information
    const priceCheckResp = await updateBasketData(basket, context);
    if (!priceCheckResp.ok) return priceCheckResp
    else basket = await priceCheckResp.json()

    // Fetch list of Stripe prices matching the Supabase products.
    const allStripeProducts: Stripe.Product[] = (await stripe.products.list({active: true})).data;
    const stripePrices = await Promise.all(
        basket.map(
            async prod => {
                // Fetch matching Stripe Product
                const stripeProd = await fetchStripeProduct(prod.sku, allStripeProducts)
                if (!stripeProd) {throw new StatusedError(
                        `Couldn't find a Stripe product matching product: ${prod.sku} ${prod.name}`,
                        500
                )}
                // Extract price ID
                if (!stripeProd.default_price) {throw new StatusedError(
                        `No default price found on product: ${prod.sku} ${prod.name}`,
                        500
                )}
                if (typeof stripeProd.default_price === "string") {
                    return {price: stripeProd.default_price, quantity: prod.basketQuantity}
                } else {
                    return {price: stripeProd.default_price.id, quantity: prod.basketQuantity}
                }
            }
        )
    )

    return new Response(JSON.stringify({stripePrices, basket}), {status: 200})
}

/**
 * Update price and images information to make sure it matches the database and hasn't been tampered with
 * 
 * This has to be done as part of the stripe prices fetch flow to ensure there's no possibility for bad
 * actors to tamper with the basket before its sent to this function
*/ 
async function updateBasketData(basket: ProductInBasket[], _context: Context) {
    // Fetch products
    const freshProducts = await getProducts(
        supabaseAnon, basket.map(p=>p.sku),
        false,
        false
    )

    // Check and amend prices
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