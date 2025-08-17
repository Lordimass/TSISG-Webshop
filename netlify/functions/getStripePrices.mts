import { Context } from "@netlify/functions";
import Stripe from 'stripe'

let stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_SECRET_KEY does not exist!")
}

type productInBasket = {
    sku: number,
    name: string,
    price: number,
    basketQuantity: number,
    images: image[]
    stock: number
}
  
type image = {
    id: number,
    image_url: string,
    display_order: number
}

export default async function handler(request: Request, context: Context) {
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
        const item: productInBasket = basket[i];
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
                    return new Response(JSON.stringify(error), {status: 500})
                }
                
            }

        } else { // If it doesn't already exist, we'll need to create it.
            try {
                stripeItem = await stripe.products.create({
                    name: item.name,
                    images: getListOfImageURLS(item.images),
                    default_price_data: {
                        currency: 'gbp',
                        unit_amount: itemprice // Stripe requires prices in pennies
                    }
                })
                if (stripeItem) {
                    const priceID = stripeItem.default_price
                    pricePointIDs.push({
                        price: priceID as string, 
                        quantity: item.basketQuantity
                    });
                } else {
                    return new Response("An item failed to create on Stripe", {status: 502})
                }
            } catch (error) {
                return new Response(JSON.stringify(error), {status: 500})
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
async function updateBasketData(basket: productInBasket[], context: Context) {
    // Fetch products
    const resp = await fetch(context.url.origin + "/.netlify/functions/getProducts", {
        method: "POST",
        body: JSON.stringify(basket.map((i)=>i.sku))
    })
    if (!resp.ok) {
        return new Response("Failed to verify product data", {status: 502})
    }
    const freshProducts = await resp.json()

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
    product: productInBasket
    ): Stripe.Product | null {
    for (let k = 0; k < stripeProducts.length; k++) {
        const stripeProduct: Stripe.Product = stripeProducts[k]
        if (stripeProduct.name == product.name) {
            return stripeProduct
        }
    }
    return null;
}

function getListOfImageURLS(images: image[]) {
    const imageList: string[] = []
    for (let i = 0; i < images.length; i++) {
        imageList.push(images[i].image_url)
    }
    return imageList
}