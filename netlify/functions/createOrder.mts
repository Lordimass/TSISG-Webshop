// Creates an order record on the Supabase Database, 
// including order_products records and an orders record.

// TODO: Secure this somehow with a unique authorisation key so that the format
// cannot be reverse-engineered to create orders at will. Possibly able to do
// that with whatever Stripe passes as authorisation since this is only ever
// caleld from their webhook

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

type metaOrderProduct = { // From compressed metadata
    sku: number
    quantity: number
    totalValue: number
}

type orderProdRecord = { // For order_products table
    order_id?: string
    product_sku: number,
    quantity: number,
    value: number
}

type orderProdCompressed = { // From orders_compressed
    sku: number,
    product_name: string,
    weight: number,
    customs_description: string,
    origin_country_code: string,
    package_type_override: string,
    category: {id: number, name: string},
    quantity: number,
    line_value: number,
    image_url: string
}

type orderRecord = {
    id?: string
    placed_at?: string,
    email: string,
    street_address: string,
    name: string,
    country: string,
    fulfilled: boolean,
    total_value: number,
    postal_code: string,
    products: orderProdCompressed[],
    city: string
}

var stripe: Stripe | null = null;
if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-03-31.basil',
      });
} else {
    console.error("STRIPE_SECRET_KEY does not exist!")
}

export default async function handler(request: Request, _context: Context) {
    if (!stripe) {
        return new Response("Stripe object didn't initialise", {status: 500})
    }
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
        return new Response("Supabase credentials not set", { status: 401 });
    }

    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

    // Authenticate request.
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
        return new Response("No Stripe endpoint secret set", {status: 401})
    }
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
        return new Response("No Stripe signature received", {status: 401})
    }

    let stripeEvent: Stripe.Event
    try {
        stripeEvent = stripe.webhooks.constructEvent(
            bodyText,
            sig,
            endpointSecret
        )
    } catch (err) {
        console.error("Failed to verify webhook signature: ", err.message)
        return new Response("Failed to verify webhook signature", {status: 400})
    }

    console.log("Verified Stripe Event.")

    // Save the order record
    const orderID = await saveOrder(dataObj, supabase)
    if (!orderID) {
        console.error("No order ID found, cannot finish saving order")
        return
    }

    // Decode metadata into an array of order products
    const orderProducts: Array<metaOrderProduct> = decodeMeta(dataObj.metadata as metaBasket)
    console.log(orderProducts)

    // Save the order_product record for each product
    await saveOrderProducts(orderProducts, orderID, supabase)

    // Update stock
    await updateStock(orderProducts, supabase)
    
    // Create Royal Mail Order
    const response = await createRMOrder(supabase, orderID)
    if (response?.status != 200) {
        return response;
    }
    
    console.log("ORDER PLACED")
    return new Response(null, {status: 200})
}

function decodeMeta(meta: metaBasket): Array<metaOrderProduct> {
    // Decodes the metadata compressed string of products in the order,
    // explanation for why this is necessary is at the top of this file,
    // above the definition of orderProduct

    const basket: Array<metaOrderProduct> = []

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
        const prod: metaOrderProduct = {
            sku: parseInt(compressedBasketArray[i][0]),
            quantity: parseInt(compressedBasketArray[i][1]),
            totalValue: parseFloat(compressedBasketArray[i][2])
        }
        basket.push(prod)
    }

    return basket;
}

async function saveOrder(dataObj: Stripe.Checkout.Session, supabase: SupabaseClient) {
    const shipping_details = dataObj.collected_information?.shipping_details;
    const amount_total = dataObj.amount_total;
    const customer_details = dataObj.customer_details;
    if (!shipping_details || !amount_total || !customer_details) {
        console.error("Stripe object was missing crucial details, couldn't save order")
        return
    }

    var orderID: string | undefined;
    const {data, error} = await supabase
        .from("orders")
        .insert({
            id: dataObj.id,
            email: customer_details.email,
            street_address: shipping_details.address.line1,
            name: shipping_details.name,
            country: shipping_details.address.country,
            total_value: amount_total/100,
            postal_code: shipping_details.address.postal_code,
            city: shipping_details.address.city
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
    return orderID
}

async function saveOrderProducts(orderProducts: Array<metaOrderProduct>, orderID: string, supabase: SupabaseClient) {
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
        .from("order_products")
        .insert(orderProdRecords)
    if (error) {
        console.error(error.code + ": " + error.message)
        return
    }
}

async function updateStock(products: Array<metaOrderProduct>, supabase: SupabaseClient) {
    // Don't update stock if this order was placed in dev mode
    if (process.env.ENVIRONMENT != "PRODUCTION") {
        console.log("Stock was not updated for this order since it was not from production.")
        return
    }
    // Fetch current stock first
    let currStock: {sku: number, stock: number, edited?:boolean}[] = [];
    const {data, error} = await supabase
        .from("products")
        .select("sku,stock")
        .in("sku", products.map((product)=>product.sku))
    if (error) {
        console.error(error)
    }
    if (data) {
        currStock = data
    } else {
        console.error("No stock returned from check")
        return
    }

    // Adjust stock
    for (let i=0; i<products.length; i++) {
        const prod = products[i]
        for (let k=0; k<currStock.length; k++) {
            const stock_item = currStock[k]
            if (stock_item.sku == prod.sku) {
                stock_item.stock -= prod.quantity
                stock_item.edited = true
            }
        }
    }
    
    console.log("New stock:")
    console.log(currStock)

    // Save new values
    for (let i=0; i<currStock.length; i++) {
        const stock_item = currStock[i]
        if (!stock_item.edited) {
            console.error(
                `Item with SKU ` + stock_item.sku + `has unchanged stock after checkout.
                This signifies that something is very wrong.`
            )
        }
        const {data, error} = await supabase
            .from("products")
            .update({stock: stock_item.stock})
            .eq("sku", stock_item.sku)
        if (error) {
            console.error(error)
        }
    }
}

/**
 * Creates an order on the Royal Mail Click & Drop API:
 * https://business.parcel.royalmail.com/
*/
async function createRMOrder(supabase: SupabaseClient, orderId: string) {
    // Get royalMailKey
    const royalMailKey = process.env.ROYAL_MAIL_KEY;
    if (!royalMailKey) {
        return new Response("No Royal Mail API Key Found", {status: 401})
    }
    
    // Fetch Orders with ID
    const {error, data} = await supabase
        .from("orders_compressed")
        .select("*")
        .eq("id", orderId)
    if (error) {
        return new Response(error.message, {status: 502})
    }
    
    // IDs should map to unique Orders
    if (data.length > 1) {
        return new Response("More than one order mapped to this ID", {status: 409})
    } else if (data.length == 0) {
        return new Response("No orders mapped to this ID", {status: 400})
    }
    const order: orderRecord = data[0];

    // Create RM Order
    const subtotal = calculateOrderSubtotal(order.products)
    const orderReference = orderId.slice(0,40) // API max order ref length is 40
    const orderWeight = calculateOrderWeight(order.products)
    const packageFormat = calculatePackageFormat(order.products, orderWeight)
    const response = await fetch("https://api.parcel.royalmail.com/api/v1/orders", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${royalMailKey}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({"items": [ // There will only ever be one order submitted at a time through this.
            { // https://api.parcel.royalmail.com/#tag/Orders/operation/CreateOrdersAsync
                orderReference: orderReference,
                recipient: {
                    address: {
                        fullName: order.name,
                        addressLine1: order.street_address,
                        city: order.city, // TODO: Find a solution to this
                        postcode: order.postal_code,
                        countryCode: order.country
                    },
                    emailAddress: order.email,
                },
                packages: [
                    {
                        weightInGrams: orderWeight,
                        packageFormatIdentifier: packageFormat,
                        contents: order.products.map((prod) => {return {
                            name: prod.product_name,
                            SKU: prod.sku,
                            quantity: prod.quantity,
                            unitValue: prod.line_value/prod.quantity,
                            unitWeightInGrams: prod.weight ? prod.weight : 0, // Weight is nullable in database
                            customsDescription: prod.customs_description,
                            originCountryCode: prod.origin_country_code,
                            customsDeclarationCategory: "saleOfGoods",
                        }})
                    }
                ],
                orderDate: order.placed_at,
                subtotal: subtotal,
                shippingCostCharged: order.total_value - subtotal,
                total: order.total_value,
            }
        ]})
    })

    const respBody = JSON.parse(await new Response(response.body).text());
    if (respBody.errorsCount > 0) {
        return new Response(JSON.stringify(respBody.failedOrders[0].errors), {status: 502})
    }
}

function calculateOrderSubtotal(items): number {
    let val = 0;
    for (let i=0; i<items.length; i++) {
        const item = items[i]
        val += item.line_value
    }
    return val
}

function calculateOrderWeight(items): number {
    let weight = 0;
    for (let i=0; i<items.length; i++) {
        const item = items[i]
        weight += item.weight
    }
    return weight
}

/**
 * Calculates what type of parcel to use, currently only small or medium
 * since these are seemingly the only options on RM Click & Drop.
 * @param items The items in the order
 * @param weight The total weight of the order
 * @returns Either "mediumParcel" or "smallParcel"
 */
function calculatePackageFormat(items: orderProdCompressed[], weight?: number) {
    if (!weight) {
        weight = calculateOrderWeight(items)
    }

    if (weight > 2000) {
        return "mediumParcel"
    }

    for (let i=0; i<items.length; i++) { // Check for overrides
        const item = items[i];
        if (item.package_type_override == "mediumParcel") {
            return "mediumParcel";
        }
    }
    return "smallParcel"
}