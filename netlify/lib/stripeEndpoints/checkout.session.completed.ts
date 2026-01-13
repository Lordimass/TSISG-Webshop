import Stripe from "stripe"
import {getCheckoutSessionItems, StripeCompoundLineItem} from "../getCheckoutSessionItems.ts"
import type {StripeProductMeta} from "@shared/types/stripeTypes.ts"
import type {CompressedOrder, OrderProduct} from "@shared/types/supabaseTypes.ts"
import {supabaseService} from "../getSupabaseClient.ts"
import {sendGA4Event} from "../lib.ts"
import {OrderProdCompressed} from "@shared/types/productTypes.ts";

export default async function handleCheckoutSessionCompleted(
    event: Stripe.CheckoutSessionCompletedEvent
) : Promise<Response | undefined> {
    const createOrderResp = await createOrder(event.data.object)
    const triggerPurchaseEventResp = await triggerGA4PurchaseEvent(event)
    if (createOrderResp && !createOrderResp.ok) {return createOrderResp}
    else if (triggerPurchaseEventResp && !triggerPurchaseEventResp.ok) {return triggerPurchaseEventResp}
    else {
        return new Response(
            JSON.stringify({
                createOrderResp,
                triggerPurchaseEventResp
            })
        )
    }
}

/**
 * Save the order event to Supabase. Also creates a Royal Mail order and updates Supabase stock if in production.
 * @param session The completed checkout session to reference in regard to this order.
 */
async function createOrder(session: Stripe.Checkout.Session): Promise<Response | undefined> {
    // Save the order record
    const order = await saveOrder(session)

    // Get products associated with the order
    const orderProducts: StripeCompoundLineItem[] = await getCheckoutSessionItems(session.id)

    // Save the order_product record for each product
    await saveOrderProducts(orderProducts, order.id)

    // Perform actions only in Production
    if (process.env.VITE_ENVIRONMENT == "PRODUCTION") {
        // Update stock of products in database
        await updateStock(orderProducts)

        // Create Royal Mail Order
        const response = await createRMOrder(order)
        if (response?.status != 200) {
            return response;
        }
    }
    
    console.log("ORDER PLACED")
    return new Response(undefined, {status: 200})
}

/**
 * Save an order to Supabase.
 * @param checkoutSession - The Stripe Checkout Session object.
 * @returns The ID of the created order.
 */
async function saveOrder(checkoutSession: Stripe.Checkout.Session) {
    const shipping_details = checkoutSession.collected_information?.shipping_details;
    const amount_total = checkoutSession.amount_total;
    const customer_details = checkoutSession.customer_details;
    if (!shipping_details || !amount_total || !customer_details) {
        throw new Error("Stripe object was missing crucial details, couldn't save order")
    }

    const {data, error} = await supabaseService
        .from("orders")
        .insert({
                id: checkoutSession.id,
                email: customer_details.email,
                street_address: shipping_details.address.line1,
                name: shipping_details.name,
                country: shipping_details.address.country,
                total_value: amount_total/100,
                postal_code: shipping_details.address.postal_code,
                city: shipping_details.address.city,
                value: {total: amount_total/100, currency: checkoutSession.currency}
            })
        .select("*")
    if (error) {
        throw new Error(error.code + ": " + error.message)
    }

    const returnedRecords = data as CompressedOrder[]
    return returnedRecords[0]
}

async function saveOrderProducts(orderProducts: StripeCompoundLineItem[], orderID: string) {
    // Construct objects for Supabase records
    let orderProdRecords: OrderProduct[] = []
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
    const {error} = await supabaseService
        .from("order_products")
        .insert(orderProdRecords)
    if (error) {
        console.error(error.code + ": " + error.message)
        return
    }
}

async function updateStock(products: StripeCompoundLineItem[]) {
    // Fetch current stock first
    let currStock: {sku: number, stock: number, edited?:boolean}[] = [];
    const {data, error} = await supabaseService
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
        const {data, error} = await supabaseService
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
 * @param order The data saved to Supabase about this order.
 */
async function createRMOrder(order: CompressedOrder) {
    // Get royalMailKey
    const royalMailKey = process.env.ROYAL_MAIL_KEY;
    if (!royalMailKey) {
        return new Response("No Royal Mail API Key Found", {status: 401})
    }

    // Fetch compressed order from Supabase
    const {data, error} = await supabaseService.from("orders_compressed").select("*").eq("id", order.id)
    if (error) {throw error}
    order = data[0] as CompressedOrder

    // Create RM Order
    const subtotal = calculateOrderSubtotal(order.products)
    const orderReference = order.id.slice(0,40) // API max order ref length is 40
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
                            name: prod.name,
                            SKU: prod.sku,
                            quantity: prod.quantity,
                            unitValue: prod.line_value/(prod.quantity*1.2), // Excluding tax for customs
                            unitWeightInGrams: prod.weight ?? 0, // Weight is nullable in database
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

function calculateOrderSubtotal(items: OrderProdCompressed[]): number {
    let val = 0;
    for (let i=0; i<items.length; i++) {
        const item = items[i]
        val += item.line_value
    }
    return val
}

function calculateOrderWeight(items: OrderProdCompressed[]): number {
    let weight = 0;
    for (let i=0; i<items.length; i++) {
        const item = items[i]
        weight += item.weight ?? 0
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

/**
 * Triggers a GA4 purchase event for the completed checkout
 * @param event - The Stripe event object.
 */
async function triggerGA4PurchaseEvent(event: Stripe.CheckoutSessionCompletedEvent): Promise<Response | undefined> {
    // Extract checkout session from event.
    const session: Stripe.Checkout.Session = event.data.object

    // Get the associated LineItems and Products compounded together.
    const lineItems: StripeCompoundLineItem[] = await getCheckoutSessionItems(session.id);

    // Extract client ID and session ID, use null if no client ID provided
    const client_id = (session.metadata?.gaClientID === "" || !session.metadata?.gaClientID) ? null : session.metadata?.gaClientID;
    const session_id = Number(session.metadata!.gaSessionID);

    // Compile payload for GA4.
    const payload = {
        client_id,
        events: [{ name: "purchase", params: {
            debug_mode: process.env.VITE_ENVIRONMENT === "DEVELOPMENT",
            session_id,
            transaction_id: session.id, // Stripe Checkout Session ID is the ID of an order/transaction.
            shipping: (session.total_details?.amount_shipping ?? 0)/100,
            tax: (session.total_details?.amount_tax ?? 0)/100,
            value: ((session.amount_total ?? 0) - (session.shipping_cost?.amount_total ?? 0)) / 100,
            currency: session.currency,
            items: stripeCompoundItemsToGA4Items(lineItems, session.currency) // Map to GA4 item format
        }}]
    }
    console.log(`Triggering PURCHASE event for transaction with value ${payload.events[0].params.currency}${payload.events[0].params.value}`)
    await sendGA4Event(payload);
    return new Response(undefined, {status: 200})
}

/**
 * Maps Stripe compound line items to GA4 item format.
 * @param lineItems - The compound line items from the Stripe checkout session.
 * @param currency - The currency of the transaction.
 * @returns An array of items formatted for GA4.
 */
export function stripeCompoundItemsToGA4Items(lineItems: StripeCompoundLineItem[], currency: string | null) {
    return lineItems.map(({lineItem, product}) => {
        // Verify that the metadata matches the expected format.
        if (!product.metadata) throw new Error("Product is missing metadata");
        const metadata: StripeProductMeta = product.metadata as unknown as StripeProductMeta
        if (!metadata.sku) throw new Error("Product is missing required metadata, cannot send serverside GA4 event.");
        return {
            item_id: metadata.sku,
            item_name: product.name,
            item_category: metadata.category,
            price: lineItem.amount_total / 100,
            quantity: lineItem.quantity,
            currency: currency,
        }
    })
}