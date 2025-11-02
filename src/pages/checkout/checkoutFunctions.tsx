import { Stripe } from "@stripe/stripe-js"
import {shipping_options } from "../../lib/consts"
import { getGAClientId, getGASessionId } from "../../lib/analytics/analytics"
import { Basket } from "@shared/types/types"

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

export async function fetchClientSecret(): Promise<string> {
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
            shipping_options: shipping_options,
            stripe_line_items: prices,
            basket: JSON.parse(basketString ? basketString : "{basket:[]}"),
            origin: window.location.origin,
            gaClientID,
            gaSessionID
        })
    })
    .then (
        function(value) {return value.json()},
        function(error) {return error}    
    )
    return result.client_secret
}

export async function fetchStripePrices(): Promise<Array<Object>> {
    const oldBasket: Basket = JSON.parse(localStorage.getItem("basket")!).basket
    const {pricePointIDs, basket} = await fetch(".netlify/functions/getStripePrices", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(oldBasket)
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