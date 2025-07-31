import { Context } from "@netlify/functions";
import Stripe from 'stripe';
import express from 'express';
import { MetadataParam } from "@stripe/stripe-js";
import { createClient } from "@supabase/supabase-js";
import { error } from "console";

var stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_SECRET_KEY does not exist!")
}

const app = express();
app.use(express.static('public'));

type bodyJSONParams = {
    shipping_options: Array<{shipping_rate: string}>,
    stripe_line_items: Array<Object>,
    basket: {basket:basketItem[]}
    origin: string
}

type basketItem = {
    sku: number,
    basketQuantity: number,
    images: Array<Object>
    price: number
}

// Metadata can contain up to 50 key-value pairs with the following constraints
// const keyMaxCharacters: number = 40
const valueMaxCharacters: number = 500

// This metadata only contains the basket string but has keys up to 50 
// incase of crazy big orders, it'll be pieced back together at the end 
// of the webhook in .netlify/functions/createOrder
type metaBasket = {
    1: string
    2?: string
    3?: string
    4?: string
    5?: string
    6?: string
    7?: string
    8?: string
    9?: string
    10?: string
    11?: string
    12?: string
    13?: string
    14?: string
    15?: string
    16?: string
    17?: string
    18?: string
    19?: string
    20?: string
    21?: string
    22?: string
    23?: string
    24?: string
    25?: string
    26?: string
    27?: string
    28?: string
    29?: string
    30?: string
    31?: string
    32?: string
    33?: string
    34?: string
    35?: string
    36?: string
    37?: string
    38?: string
    39?: string
    40?: string
    41?: string
    42?: string
    43?: string
    44?: string
    45?: string
    46?: string
    47?: string
    48?: string
    49?: string
    50?: string
}

export default async function handler(request: Request, _context: Context) {
    if (!stripe) {
        return new Response(null, {
            status: 400,
            statusText: "Failed to connect to stripe."
        })
    }
    
    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const bodyJSON: bodyJSONParams = JSON.parse(bodyText)

    let basket: basketItem[] = bodyJSON.basket.basket
    const compressedBasket: MetadataParam = compressBasket(basket)
    console.log(compressedBasket)

    const session = await stripe.checkout.sessions.create({
        ui_mode: "custom",
        line_items: bodyJSON.stripe_line_items,
        mode: "payment",
        return_url: bodyJSON.origin + "/thankyou?session_id={CHECKOUT_SESSION_ID}",
        shipping_options: bodyJSON.shipping_options,
        shipping_address_collection: { allowed_countries: []},
        metadata: compressedBasket,
        automatic_tax: {enabled: true}
    })

    return new Response(JSON.stringify(session))
}

/**
 * Stripe metadata can only contain 500 chars per value, so the basket
 * needs to be trimmed to contain only essential characters
*/
function compressBasket(basket: basketItem[]): MetadataParam {
    // Compress into array of arrays with corresponding indices
    // 0: sku
    // 1: basketQuantity
    // 2: totalValue
    var compressedBasketArray: Array<Array<string>> = []
    for (let i = 0; i < basket.length; i++) {
        const item = basket[i]
        compressedBasketArray.push([
                item.sku.toString(),
                item.basketQuantity.toString(),
                (item.price * item.basketQuantity).toString()
            ])
    }

    // Convert to string and split if necessary
    var compressedBasketFullString: string = JSON.stringify(compressedBasketArray)
    var compressedBasketMeta: metaBasket = {1: ""};
    for (
        let i = 1;
        i<valueMaxCharacters && compressedBasketFullString.length > 0;
         i++
        ) {

        const segment: string = compressedBasketFullString.substring(
            0,
            Math.min(valueMaxCharacters, compressedBasketFullString.length)
        ) 
        compressedBasketFullString = compressedBasketFullString.substring(
            Math.min(valueMaxCharacters, compressedBasketFullString.length)-1,
            compressedBasketFullString.length-1
        )
        const key = i as keyof metaBasket
        compressedBasketMeta[key] = segment
    }

    // If there are still characters left, it means the metadata keys were all filled
    // and there is no space left to transmit data
    if (compressedBasketFullString.length > 0) {
        console.error("Basket too long to fit in metadata, will cause issues")
    }

    // TODO: Stop customer from ordering if there are too many items in the basket,
    // this isn't urgent because you'd have to order *a lot* of items (as in over
    // 1000 unique items) so it should be almost impossible to encounter unless
    // they're spending an obscene amount of money.
    return compressedBasketMeta;
} 