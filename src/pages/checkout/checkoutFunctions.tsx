import { Stripe } from "@stripe/stripe-js"
import {shipping_options } from "../../lib/consts"
import { getGAClientId, getGASessionId } from "../../lib/analytics/analytics"
import { Basket } from "@shared/types/types"
import {DEFAULT_CURRENCY, DEFAULT_LOCALE} from "../../localeHandler.ts";
import {getCurrency} from "locale-currency";
import {Currency} from "dinero.js";

/**
 * Debug method to test Apple Pay
 */
export async function checkCanMakePayment(stripePromise: Promise<Stripe | null>) {
    const pr = (await stripePromise)?.paymentRequest({
        country: "GB",
        currency: "gbp",
        total: {
        label: "Test Item",
        amount: 1,
        },
        requestPayerName: true,
        requestPayerEmail: true,
    })
    if (!pr) {
        return `[PAYMENT REQUEST FAILED TO INITIALISE]`
    } else {
        return `pr.canMakePayment() => ${JSON.stringify(await pr.canMakePayment())}`
    }
}

export function redirectIfEmptyBasket() {
    const basketString: string | null = localStorage.getItem("basket")

    if (!basketString 
        || basketString == "{\"basket\":[]}" 
        || basketString == "{}"
    ) {
        window.location.href = "/"
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
    /** 2-Character ISO Country Code of the user */
    const countryCode: string = locale.split("-")[1]
    /** 3-Character ISO Currency Code to use for the prices */
    const currency: Currency = getCurrency(locale) as Currency || DEFAULT_CURRENCY;

    // Construct parameters for request to createCheckoutSession
    const prices: Array<Object> = await fetchStripePrices(currency)
    const basketString = localStorage.getItem("basket")
    const gaClientID = getGAClientId();
    const gaSessionID = await getGASessionId();

    const result = await fetch(".netlify/functions/createCheckoutSession", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            shipping_options: shipping_options,
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

export async function fetchStripePrices(currency: Currency): Promise<Array<Object>> {
    const oldBasket: Basket = JSON.parse(localStorage.getItem("basket")!).basket
    const {pricePointIDs, basket} = await fetch(".netlify/functions/getStripePrices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({basket: oldBasket, currency})
    })
    .then (
        async function(value) {return await value.json()},
        function(error) {console.error(error); return error}
    )
    localStorage.setItem("basket", JSON.stringify({basket, "lastUpdated": (new Date()).toISOString()}))
    
    return pricePointIDs;
}

export async function validateEmail(email: string, checkout: any) {
    const updateResult = await checkout.updateEmail(email);
    const isValid = updateResult.type !== "error";
    return { isValid, message: !isValid ? updateResult.error.message : null};
}