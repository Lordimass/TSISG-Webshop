import ReactGA from "react-ga4"
import { Basket, ProductData, ProductInBasket } from "@shared/types/types"
import { GA4Product } from "./types";
import {DEFAULT_CURRENCY} from "../../localeHandler.ts";
import DineroFactory, {Currency} from "dinero.js";
import {convertDinero} from "../../components/price/lib.tsx";

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

async function convertToGA4Product(
    p: ProductData | ProductInBasket,
    currency: Currency = DEFAULT_CURRENCY
): Promise<GA4Product> {
    const dinero = DineroFactory({amount: Math.round(p.price*100), currency: DEFAULT_CURRENCY, precision: 2});
    const convertedDinero = await convertDinero(dinero, currency);

    return {
        item_id: p.sku.toString(),
        item_name: p.name,
        item_category: p.category.name,
        item_variant: p.metadata.variant_name,
        price: convertedDinero.getAmount(),
        quantity: "basketQuantity" in p ? p.basketQuantity : undefined
    }
}

async function getBasketAsGA4Products(currency: Currency = DEFAULT_CURRENCY): Promise<{
    items: GA4Product[],
    value: number
}> {
    const basketString = localStorage.getItem("basket")
    if (!basketString) return {items: [], value: 0}
    const basketObj = JSON.parse(basketString)
    if (!("basket" in basketObj)) {
        console.error("localStorage Basket Malformed"); return {items: [], value: 0};
    }
    const basket: Basket = basketObj.basket
    const itemPromises = basket.map(p => convertToGA4Product(p, currency))
    const items = await Promise.all(itemPromises)
    let value = 0; 
    items.forEach(p => value += p.price ?? 0)
    return {items, value}
}

export async function triggerAddShippingInfo(
    currency = DEFAULT_CURRENCY,
    coupon?: string,
    shipping_tier?: string
) {
    const {items, value} = await getBasketAsGA4Products()
    gtag("event", "add_shipping_info", {
        currency, value, coupon, shipping_tier, items
    })
}

export async function triggerAddPaymentInfo(
    currency = DEFAULT_CURRENCY,
    coupon?: string,
    payment_type?: string
) {
    const {items, value} = await getBasketAsGA4Products()

    gtag("event", "add_payment_info", {
        currency, value, coupon, payment_type, items
    })
}

export async function triggerAddToCart(
    product: ProductData,
    change: number,
    currency = DEFAULT_CURRENCY
) {
    const func = change>0 ? "add_to_cart" : "remove_from_cart"
    const value = product.price*change
    const item = await convertToGA4Product(product)
    item.quantity = change
    
    gtag("event", func, {
        currency, 
        value, 
        items: [item]
    })
}

export async function triggerViewCart(
    currency= DEFAULT_CURRENCY
) {
    const {items, value} = await getBasketAsGA4Products()
    
    gtag("event", "view_cart", {
        currency, value, items
    })
}

export async function triggerBeginCheckout(
    coupon?: string,
    currency = DEFAULT_CURRENCY
) {
    const {items, value} = await getBasketAsGA4Products()

    gtag("event", "begin_checkout", {
        currency, value, coupon, items
    })
}

export async function triggerViewItem(
    product: ProductData | ProductData[],
    currency = DEFAULT_CURRENCY
) {
    const prods: ProductData[] = !("length" in product) ? [product] : product
    const itemPromises = prods.map((p) => convertToGA4Product(p, currency))
    const items = await Promise.all(itemPromises)
    let value = 0;
    prods.forEach(p => value+=p.price) 

    gtag("event", "view_item", {
        currency, items, value
    })
}

export async function triggerViewItemList(
    prods: ProductData[],
    item_list_id?: string,
    item_list_name?: string,
    currency = DEFAULT_CURRENCY
) {
    const itemPromises = prods.map((p) => convertToGA4Product(p, currency))
    const items = await Promise.all(itemPromises)

    gtag("event", "view_item_list", {
        currency, item_list_id, item_list_name, items
    })
}

export function triggerSearch(search_term: string, ignore_single_characters = true) {
    if (ignore_single_characters && search_term.length <= 1) return
    gtag("event", "search", {search_term})
}

export function triggerSignUp(method: string) {
    gtag("event", "sign_up", {method})
}

export function triggerLogin(method: string) {
    gtag("event", "login", {method})
}