import { Context } from "@netlify/functions";
import Stripe from 'stripe'

var stripe: Stripe | null = null;
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

    var pricePointIDs: Array<Object> = [];

    const stripeProducts: Array<Stripe.Product> = (await stripe.products.list()).data;

    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const basket: Array<productInBasket> = JSON.parse(JSON.parse(bodyText)).basket;

    for (let i = 0; i < basket.length; i++) {
        const item: productInBasket = basket[i];
        var stripeItem: Stripe.Product | null = getProductOnStripe(stripeProducts, item);
        
        if (stripeItem) { // If the item already exists on stripe, use it as is.
            var price: Stripe.Price = await stripe.prices.retrieve(stripeItem.default_price as string)
            if (price.unit_amount == item.price*100) {
                pricePointIDs.push({
                    price: stripeItem.default_price as string, 
                    quantity: item.basketQuantity
                })
            } else {
                var priceID = await stripe.prices.create({
                    currency: "gbp",
                    unit_amount: item.price*100
                })
                pricePointIDs.push({
                    price: priceID as unknown as string, 
                    quantity: item.basketQuantity
                })
            }

        } else { // If it doesn't already exist, we'll need to create it.
            stripeItem = await stripe.products.create({
                name: item.name,
                images: getListOfImageURLS(item.images),
                default_price_data: {
                    currency: 'gbp',
                    unit_amount: item.price*100
                }
            })
            if (stripeItem) {
                const priceID = stripeItem.default_price
                pricePointIDs.push({
                    price: priceID as string, 
                    quantity: item.basketQuantity
                });
            }
        }
    }

    return new Response(JSON.stringify(pricePointIDs))
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
    var imageList: string[] = []
    for (let i = 0; i < images.length; i++) {
        imageList.push(images[i].image_url)
    }
    return imageList
}