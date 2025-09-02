// Creates an order record on the Supabase Database, 
// including order_products records and an orders record.

import { Context } from '@netlify/functions';
import { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import getSupabaseClient from '../lib/getSupabaseClient.mts';
import { getCheckoutSessionItems, StripeCompoundLineItem } from '../lib/getCheckoutSessionItems.mts';
import { Order, OrderProdCompressed, OrderProduct } from '../lib/types/supabaseTypes.mts';

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
    const bodyString = await request.text()
    const body: Stripe.CheckoutSessionCompletedEvent = JSON.parse(bodyString)
    const checkoutSession = body.data.object

    // Get Supabase Object, Service Role required since the objects table is protected
    const {error: supError, supabase} = await getSupabaseClient(undefined, true);
    if (supError) return supError;

    // Authenticate request from Stripe.
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!endpointSecret) {
        return new Response("No Stripe endpoint secret set", {status: 401})
    }
    const sig = request.headers.get("stripe-signature");
    if (!sig) {
        return new Response("No Stripe signature received", {status: 401})
    }

    try {
        stripe.webhooks.constructEvent(
            bodyString,
            sig,
            endpointSecret
        )
    } catch (err) {
        console.error("Failed to verify webhook signature: ", err.message)
        return new Response("Failed to verify webhook signature", {status: 400})
    }

    console.log("Verified Stripe Event.")

    // Save the order record
    const orderID = await saveOrder(checkoutSession, supabase!)

    // Get products associated with the order
    const orderProducts: StripeCompoundLineItem[] = await getCheckoutSessionItems(checkoutSession.id)

    // Save the order_product record for each product
    await saveOrderProducts(orderProducts, orderID, supabase!)

    // Perform actions only in Production
    if (process.env.VITE_ENVIRONMENT == "PRODUCTION") {
        // Update stock of products in database
        await updateStock(orderProducts, supabase!)

        // Create Royal Mail Order
        const response = await createRMOrder(supabase!, orderID)
        if (response?.status != 200) {
            return response;
        }
    }
    
    console.log("ORDER PLACED")
    return new Response(undefined, {status: 200})
}

/**
 * Save an order to Supabase.
 * @param dataObj - The Stripe Checkout Session object.
 * @param supabase - The Supabase client instance.
 * @returns The ID of the created order.
 */
async function saveOrder(dataObj: Stripe.Checkout.Session, supabase: SupabaseClient) {
    const shipping_details = dataObj.collected_information?.shipping_details;
    const amount_total = dataObj.amount_total;
    const customer_details = dataObj.customer_details;
    if (!shipping_details || !amount_total || !customer_details) {
        throw new Error("Stripe object was missing crucial details, couldn't save order")
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
        throw new Error(error.code + ": " + error.message)
    }

    const returnedRecord = data as Order[]
    orderID = returnedRecord[0].id
    if (!orderID) {
        throw new Error("Order ID not found in returned data " + data)
    }
    return orderID
}

async function saveOrderProducts(orderProducts: StripeCompoundLineItem[], orderID: string, supabase: SupabaseClient) {
    // Construct objects for Supabase records
    var orderProdRecords: Array<OrderProduct> = []
    for (let i=0; i<orderProducts.length; i++) {
        const prod = orderProducts[i];
        const meta = prod.product.metadata;
        orderProdRecords.push({
            order_id: orderID,
            product_sku: meta.sku,
            quantity: prod.lineItem.quantity ?? 0,
            value: prod.lineItem.amount_total ? prod.lineItem.amount_total/100 : 0
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

async function updateStock(products: StripeCompoundLineItem[], supabase: SupabaseClient) {
    // Fetch current stock first
    let currStock: {sku: number, stock: number, edited?:boolean}[] = [];
    const {data, error} = await supabase
        .from("products")
        .select("sku,stock")
        .in("sku", products.map((prod)=>prod.product.metadata.sku))
    if (error) {
        console.error(`Failed to fetch stock! Stock not updated for order. ${error}`)
    } else {
        currStock = data
    }

    // Adjust stock
    for (let i=0; i<products.length; i++) {
        const prod = products[i]
        const meta = prod.product.metadata
        for (let k=0; k<currStock.length; k++) {
            const stock_item = currStock[k]
            const change = prod.lineItem.quantity ?? 0
            if (stock_item.sku == meta.sku) {
                stock_item.stock -= change
                stock_item.edited = change > 0 // Should always be true.
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
    const order: Order = data[0];

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
                        city: order.city,
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
function calculatePackageFormat(items: OrderProdCompressed[], weight?: number) {
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