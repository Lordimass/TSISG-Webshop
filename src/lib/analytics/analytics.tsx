import ReactGA from "react-ga4"
import { Basket, ProductData, ProductInBasket } from "../types"
import { GA4Product } from "./types";

/**
 * Get the Google Analytics client ID from the cookie.
 * @returns The GA client ID or null if not found.
 */
export function getGAClientId(): string | null {
    // Get the _ga cookie value.
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('_ga='));
    if (!cookie) return null;
    const value = cookie.split('=')[1];

    // Cookie looks like GA1.2.1234567890.987654321
    // The last two parts are the client ID
    // Decode and extract the client ID
    const parts = value.split('.');
    if (parts.length >= 4) {
        return `${parts[2]}.${parts[3]}`;
    }
    return null;
}

export async function getGAClientIdGtag(): Promise<string | null> {
    return new Promise((resolve) => {
        ReactGA.gtag("get", import.meta.env.VITE_GA4_MEASUREMENT_ID, "client_id", (id: any) => {
            resolve(id);
        });
    });
}

/**
 * Get the Google Analytics session ID.
 * @returns The GA session ID or null if not found.
 */
export async function getGASessionId(): Promise<string | null> {
    return new Promise((resolve) => {
        ReactGA.gtag("get", import.meta.env.VITE_GA4_MEASUREMENT_ID, "session_id", (id: any) => {
            resolve(id);
        });
    });
}

export function convertToGA4Product(p: ProductData | ProductInBasket): GA4Product {
    return {
        item_id: p.sku.toString(),
        item_name: p.name,
        item_category: p.category.name,
        item_variant: p.metadata.variant_name,
        price: p.price,
        quantity: "basketQuantity" in p ? p.basketQuantity : undefined
    }
}

export function getBasketAsGA4Products(): GA4Product[] {
    const basketString = localStorage.getItem("basket")
    if (!basketString) return []
    const basketObj = JSON.parse(basketString)
    if (!("basket" in basketObj)) {console.error("localStorage Basket Malformed"); return [];}
    const basket: Basket = basketObj.basket
    return basket.map(convertToGA4Product)
}

export function triggerAddShippingInfo(currency = "GBP", coupon?: string, shipping_tier?: string) {
    const items = getBasketAsGA4Products()
    let value = 0; 
    items.forEach(p => value += p.price ?? 0)

    gtag("event", "add_shipping_info", {
        currency, value, coupon, shipping_tier, items
    })
}

export function triggerAddPaymentInfo(currency = "GBP", coupon?: string, payment_type?: string) {
    const items = getBasketAsGA4Products()
    let value = 0; 
    items.forEach(p => value += p.price ?? 0)

    gtag("event", "add_payment_info", {
        currency, value, coupon, payment_type, items
    })
}

export function triggerAddToCart(product: ProductData, change: number, currency = "GBP") {
    const func = change>0 ? "add_to_cart" : "remove_from_cart"
    const value = product.price*change
    const item = convertToGA4Product(product)
    item.quantity = change
    
    gtag("event", func, {
        currency, 
        value, 
        items: [item]
    })
}