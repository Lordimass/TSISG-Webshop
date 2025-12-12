import {ProductsInBasket, ProductData, ProductInBasket, Basket} from "@shared/types/types"
import {supabase} from "./supabaseRPC"
import {compareProducts} from "./sortMethods"
import {daysOfWeek, monthsOfYear} from "./consts"
import {triggerAddToCart} from "./analytics/analytics"
import {Currency} from "dinero.js";
import {DEFAULT_CURRENCY} from "../localeHandler.ts";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";

/**
 * Refresh the data associated with products in the basket, to prevent data getting stale
 */
export async function refreshBasket() {
    console.log("Refreshing Basket");
    const basket = getBasketProducts()

    // Fetch new data on products
    const skusToFetch: number[] = basket.map((prod: ProductInBasket) => prod.sku)
    const newProducts = await getProducts(supabase, skusToFetch, false, false)

    // Save new data
    const newBasket: ProductInBasket[] = []
    basket.forEach((basketProd: ProductInBasket) => {
        newProducts.forEach((newProduct: ProductData) => {
            if (newProduct.sku === basketProd.sku) {
                newBasket.push({...newProduct, basketQuantity: basketProd.basketQuantity})
            }
        })
    })
    if (newBasket.length > 0) {
        localStorage.setItem("basket", JSON.stringify({
            products: newBasket,
            lastUpdated: (new Date()).toISOString()
        }))
    }
}

/**
 * Opens a JSON object in a new browser tab
 * @param obj The JSON object to open
 */
export function openObjectInNewTab(obj: any) {
    const jsonString = JSON.stringify(obj, null, 2); // pretty-print

    const blob = new Blob([jsonString], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    window.open(url, "_blank");
}

/**
 * Returns the extension of the filename given.
 * @param filename The filename to extract an extension from.
 */
export function getFilenameExtension(filename: string) {
    return filename.split(".").slice(-1)[0]
}

/**
 * Get the ProductData for the products in the group with `name`
 * @param name The name of the group to fetch products for
 * @returns A list of products in the given group, empty if no such
 * group exists
 */
export async function getGroup(name: string | null): Promise<ProductData[]> {
    if (!name) return []

    // Fetch SKU list
    const {data: skus, error} = await supabase
        .from("products")
        .select("sku")
        .eq("group_name", name)
    if (error) throw error
    // No products with this group name
    if (skus.length === 0) return []

    // Return the products associated with these skus
    const products = await getProducts(supabase, skus.map(sku => sku.sku))
    return products.sort(compareProducts)
}

/**
 * Given a new quantity and relevant information on a product to associate it with,
 * update the local storage basket to contain that new quantity
 */
export async function setBasketStringQuantity(
    prod: ProductData | ProductInBasket,
    quant: number,
    currency: Currency = DEFAULT_CURRENCY
) {
    console.log(`Setting basket quantity of SKU ${prod.sku} to ${quant}`);
    /** The change in quantity from this update, used for GA4 triggers */
    let diff = 0
    const basket = getBasket();

    // If this is a new basket, set last updated to current time
    if (basket.lastUpdated === 0) basket.lastUpdated = Date.now()

    // Find product and set quantity
    let found: boolean = false
    // Using for loop instead of forEach for splicing
    for (let i = 0; i < basket.products.length; i++) {
        let item: ProductInBasket = basket.products[i]
        if (item.sku == prod.sku) {
            diff = quant - item.basketQuantity
            found = true
            // Just remove it from the basket if 0
            if (quant == 0) {
                basket.products.splice(i, 1)
                break
            }
            item.basketQuantity = quant
            break
        }
    }
    // If it wasn't found, create it
    if (!found && quant > 0) {
        diff = quant
        basket.products.push({...prod, basketQuantity: quant})
    }

    // Save to localStorage
    localStorage.setItem("basket", JSON.stringify(basket))
    window.dispatchEvent(new CustomEvent("basketUpdate"))

    // Trigger GA4 Event
    await triggerAddToCart(prod, diff, currency)
}

/**
 * Checks whether a given value is able to be converted to a number
 * @param value
 */
export function isNumeric(value: string): boolean {
    return !Number.isNaN(value);
}

/**
 * Attempt to parse a string as JSON and return it, if it's not valid then just return the string again.
 * Helpful for logging when you don't know what the string is but want to log it nicely.
 * @param value String to attempt to parse
 * @returns Either the start string or a JSON object
 */
export function softParseJSON(value: string): any {
    try {
        return JSON.parse(value)
    } catch {
        return value
    }
}

export async function fetchPolicy(name: string): Promise<string> {
    const resp = await fetch(`https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/policies//${name}.md`)
    return resp.text()
}

export function dateToDateString(date: Date, short = false) {
    if (!short) return daysOfWeek[date.getDay()] +
        " " + date.getDate() +
        " " + monthsOfYear[date.getMonth()] +
        " " + date.getFullYear();
    else return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear().toString(10).slice(2)}`
}

export function dateToTimeString(date: Date) {
    return date.getHours().toString().padStart(2, "0") + ":"
        + date.getMinutes().toString().padStart(2, "0") + ":"
        + date.getSeconds().toString().padStart(2, "0")
}

/**
 * Takes a duration in milliseconds and converts it to
 * a string hh:mm:ss
 * @param duration A duration in milliseconds
 * @returns A string hh:mm:ss
 */
export function durationToDurationString(duration: number): string {
    const hours = Math.floor(duration / 3.6e+6)
    duration -= hours * 3.6e+6
    const minutes = Math.floor(duration / 6e+4)
    duration -= minutes * 6e+4
    const seconds = Math.floor(duration / 1000)
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

/**
 * Fetch and return the basket from localStorage, including type validation.
 * @returns A {@link Basket} object. This will contain an empty list of products and a {@link Basket.lastUpdated} date of the Unix Epoch
 * if no basket was found in localStorage.
 */
export function getBasket(): Basket {
    // Fetch from localStorage
    const basketString = localStorage.getItem("basket");
    if (!basketString) return {products: [], lastUpdated: 0}
    const basketObj = JSON.parse(basketString) as Basket;

    // Validate shape
    if (VALIDATORS.Basket(basketObj)) return basketObj as Basket;
    console.warn(`
        Basket was not in expected shape, resetting basket. Old basket:
        ${JSON.stringify(basketObj, undefined, 2)}`
    )
    logValidationErrors("Basket")

    // Reset basket if validation failed, clearing any old or mismatched basket representations
    localStorage.removeItem("basket")
    window.dispatchEvent(new CustomEvent("basketUpdate"))

    return {products: [], lastUpdated: 0};
}

/**
 * Wrapper function for {@link getBasket}
 * Fetch and return the products in the basket from localStorage, including type validation.
 * @returns An array of {@link ProductInBasket}s. This will be an empty array if no basket was found in localStorage.
 */
export function getBasketProducts(): ProductInBasket[] {
    return getBasket().products
}