import { getGAClientId, getGASessionId } from "../../lib/analytics/analytics"
import {ProductInBasket, StockDiscrepency} from "@shared/types/types"
import {DEFAULT_CURRENCY, DEFAULT_LOCALE} from "../../localeHandler.ts";
import {getCurrency} from "locale-currency";
import {Currency} from "dinero.js";
import {getPath} from "../../lib/paths.ts";
import {getBasketProducts} from "../../lib/lib.tsx";
import {supabase} from "../../lib/supabaseRPC.tsx";

export function redirectIfEmptyBasket() {
    const basketString: string | null = localStorage.getItem("basket")

    if (!basketString 
        || basketString == "{\"basket\":[]}" 
        || basketString == "{}"
    ) {
        window.location.href = getPath("HOME")
    }
}

/**
 * Creates a Stripe Checkout Session.
 * @return The client secrete for the created checkout session.
 */
export async function createCheckoutSession(): Promise<string> {
    // Get the user's location from the query string since we can't access Context here.
    const urlParams = new URLSearchParams(window.location.search);
    const locale = urlParams.get("locale") || DEFAULT_LOCALE;
    /** 3-Character ISO Currency Code to use for the prices */
    const currency: Currency = getCurrency(locale) as Currency || DEFAULT_CURRENCY;

    // Construct parameters for request to createCheckoutSession
    const prices: Array<Object> = await fetchStripePrices()
    const basketString = localStorage.getItem("basket")
    const gaClientID = getGAClientId();
    const gaSessionID = await getGASessionId();

    const result = await fetch(".netlify/functions/createCheckoutSession", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            stripe_line_items: prices,
            basket: JSON.parse(basketString ? basketString : "{basket:[]}"),
            origin: window.location.origin,
            gaClientID,
            gaSessionID,
            // Stripe uses the location to determine currency automatically, so we pass the location instead of currency.
            currency
        })
    })
    .then (
        function(value) {return value.json()},
        function(error) {return error}    
    )
    return result.client_secret
}

export async function fetchStripePrices(): Promise<Array<Object>> {
    const oldBasket: ProductInBasket[] = getBasketProducts()
    const {stripePrices, basket} = await fetch(".netlify/functions/getStripePrices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({basket: oldBasket})
    })
    .then (
        async function(value) {return await value.json()},
        function(error) {throw error}
    )
    console.log("Updated prices from remote")
    localStorage.setItem("basket", JSON.stringify({products: basket, "lastUpdated": Date.now()}))
    
    return stripePrices;
}

export async function validateEmail(email: string, checkout: any) {
    const updateResult = await checkout.updateEmail(email);
    const isValid = updateResult.type !== "error";
    return { isValid, message: !isValid ? updateResult.error.message : null};
}

/**
 * Find discrepencies between the basket quantities and fresh stock numbers from the database.
 */
export async function checkStock() {
    const prods = getBasketProducts();

    // Fetch up-to-date data from Supabase.
    const {data, error} = await supabase
        .from("products")
        .select("sku, stock")
        .in("sku", prods.map(prod => prod.sku))
    if (error) {
        throw error;
    } else if (!data) {
        throw Error("No data returned when checking product stock")
    } else if (data.length != prods.length) {
        throw Error("Unable to find some products on the database when checking product stock")
    }

    // Find discrepencies
    const discrepencies: StockDiscrepency[] = []
    data.forEach((supaProd) => {
        // Find matching productInBasket.
        // Using `foreach` instead of `filter` here since there should only be one match.
        prods.forEach(prod => {
            if (prod.sku != supaProd.sku) return

            // Calculate stock diff, if there is some, report it
            const diff = prod.basketQuantity - supaProd.stock
            if (diff > 0) {
                discrepencies.push({
                    sku: prod.sku,
                    stock: supaProd.stock,
                    basketQuantity: prod.basketQuantity,
                    name: prod.name
                })
            }
        })
    })
    return discrepencies
}