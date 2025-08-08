import { Context } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
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

export default async function handler(request: Request, _context: Context) {
    if (!stripe) {
        return
    }

    const pricePointIDs: Array<Object> = [];
    const stripeProducts: Array<Stripe.Product> = (await stripe.products.list()).data;

    const body = request.body;
    const bodyText: string = await new Response(body).text();
    let basket: productInBasket[] = JSON.parse(JSON.parse(bodyText)).basket;

    // Check prices are accurate
    const priceCheckResp = await updateBasketData(basket);
    if (!priceCheckResp.ok) {
        return priceCheckResp
    } else {
        basket = await priceCheckResp.json()
    }

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
*/ 
async function updateBasketData(basket: productInBasket[]) {
    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_ANON_KEY;

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    try {
        const {data, error} = await supabase
            .from("products")
            .select("sku, price, images:product_images(*)")
            .in("sku", basket.map((i)=>i.sku))
        if (error) {
            return new Response(error.message, {status: 502})
        }

        // Check and ammend prices 
        for (let i=0; i<basket.length; i++) {
            const basketItem = basket[i]
            for (let j=0; j<data.length; j++) {
                const dataItem = data[i]
                if (dataItem.sku == basketItem.sku) {
                    basketItem.price = dataItem.price
                    basketItem.images = dataItem.images
                }
            }
        }
        return new Response(JSON.stringify(basket), {status: 200})
        
    } catch (error) {
        return new Response(JSON.stringify(error), {status: 500})
    }
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