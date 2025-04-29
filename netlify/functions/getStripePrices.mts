import { Context } from "@netlify/functions";
import Stripe from 'stripe'

const stripe = require('stripe')(process.env.STRIPE_KEY);

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
    var pricePointIDs: Array<Object> = [];

    const stripeProducts: Array<Stripe.Product> = (await stripe.products.list()).data;

    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const basket: Array<productInBasket> = JSON.parse(JSON.parse(bodyText)).basket;

    for (let i = 0; i < basket.length; i++) {
        const item: productInBasket = basket[i];
        var stripeItem: Stripe.Product | null = getProductOnStripe(stripeProducts, item);
        if (stripeItem) {
            var price: Stripe.Price = await stripe.prices.retrieve(stripeItem.default_price)
            if (price.unit_amount == item.price*100) {
                pricePointIDs.push({
                    price: stripeItem.default_price as string, 
                    quantity: item.basketQuantity
                })
            } else {
                var priceID = await stripe.prices.create({
                    currency: "gbp",
                    unit_ammount: item.price*100
                })
                pricePointIDs.push({
                    price: priceID as string, 
                    quantity: item.basketQuantity
                })
            }

        } else {
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