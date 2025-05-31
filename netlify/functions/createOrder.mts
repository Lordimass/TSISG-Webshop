// Creates an order record on the Supabase Database, 
// including order-products records and an orders record.

import { Context } from '@netlify/functions';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Metadata can contain up to 50 key-value pairs with the following constraints
// const keyMaxCharacters: number = 40
// const valueMaxCharacters: number = 500
// This metadata only contains basket but has keys up to 50 incase of crazy big
// orders, its created when the checkout session is made, then will be decrypted
// here to store the order on the database

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

type orderProduct = {
    sku: number
    quantity: number
    totalValue: number
}

type orderProdRecord = {
    order_id?: number
    product_sku: number,
    quantity: number,
    value: number
}

type orderRecord = {
    id?: number
    placed_at?: string,
    email: string,
    street_address: string,
    name: string,
    country: string,
    fulfilled: boolean,
    total_value: number,
    postal_code: string,
}

export default async function handler(request: Request, _context: Context) {
    const body = request.body;
    const bodyText: string = await new Response(body).text();
    const bodyJSON: Stripe.CheckoutSessionCompletedEvent = JSON.parse(bodyText)
    const dataObj = bodyJSON.data.object

    // Grab URL and Key from Netlify Env Variables.
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // SERVICE_ROLE required because orders table is protected.

    // Validate that they were both successfully fetched.
    if (!supabaseUrl || !supabaseKey) {
        return new Response("Supabase credentials not set", { status: 500 });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

    // Get Details
    const amount_total = dataObj.amount_total
    if (!amount_total) {
        console.error("Missing amount total")
        return
    }
    const shipping_details = dataObj.collected_information?.shipping_details

    // Save Order
    var orderID: number | undefined;
    const {data, error} = await supabase
        .from("orders")
        .insert({
            email: dataObj.customer_details?.email,
            street_address: shipping_details?.address.line1,
            name: shipping_details?.name,
            country: shipping_details?.address.country,
            total_value: amount_total/100,
            postal_code: shipping_details?.address.postal_code
            })
        .select() 
    if (error) {
        console.error(error.code + ": " + error.message)
        return
    }

    const returnedRecord = data as orderRecord[]
    orderID = returnedRecord[0].id
    if (!orderID) {
        console.error("Order ID not found in returned data " + data)
        return
    }
    

    // Save Order-Products
    // -------------------
    // Decode the metadata into an array of order products
    {
    const orderProducts: Array<orderProduct> = decodeMeta(dataObj.metadata as metaBasket)
    console.log(orderProducts)

    // Construct objects for Supabase records
    var orderProdRecords: Array<orderProdRecord> = []
    for (let i=0; i<orderProducts.length; i++) {
        const product = orderProducts[i];
        orderProdRecords.push({
            order_id: orderID,
            product_sku: product.sku,
            quantity: product.quantity,
            value: product.totalValue 
        })
    }

    // Save to Supabase
    const {error} = await supabase
        .from("order-products")
        .insert(orderProdRecords)
    if (error) {
        console.error(error.code + ": " + error.message)
        return
    }
    console.log("ORDER PLACED")
    }

}

function decodeMeta(meta: metaBasket): Array<orderProduct> {
    // Decodes the metadata compressed string of products in the order,
    // explanation for why this is necessary is at the top of this file,
    // above the definition of orderProduct

    const basket: Array<orderProduct> = []

    // Piece back together the compressed string
    var basketString: string = ""
    for (let i=1; i<50; i++) {
        const key = i as keyof metaBasket
        const segment: string | undefined = meta[key]
        if (!segment) {
            // There's nothing left to decode, break out
            break;
        }
        basketString += segment;
    }

    // Go through the array and parse it back into an array of objects
    var compressedBasketArray: Array<Array<string>> = JSON.parse(basketString);
    for (let i=0; i<compressedBasketArray.length; i++) {
        const prod: orderProduct = {
            sku: parseInt(compressedBasketArray[i][0]),
            quantity: parseInt(compressedBasketArray[i][1]),
            totalValue: parseFloat(compressedBasketArray[i][2])
        }
        basket.push(prod)
    }

    return basket;
}