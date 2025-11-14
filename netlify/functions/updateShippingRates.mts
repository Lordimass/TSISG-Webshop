import {Config} from "@netlify/functions";
import {stripe} from "../lib/stripeObject.mts";
import DineroFactory, {Currency} from "dinero.js";
import {convertDinero} from "@shared/functions/price.ts";
import Stripe from "stripe";
import CurrencyOptions = Stripe.ShippingRate.FixedAmount.CurrencyOptions

// TODO: Implement the same logic for items, using currency_options instead of lots of price points.

/**
 * Scheduled function to update Stripe shipping rates for other currencies.
 * @param request
 */
export default async function handler(request: Request) {
    // Fetch list of supported currencies
    const {supported_payment_currencies} = await stripe.countrySpecs.retrieve("GB")

    // Fetch list of all shipping rates.
    const shippingRates = await stripe
        .shippingRates
        // Only need active rates.
        .list({active: true})
        // Fetch up to 10 rates per currency to safely fetch all.
        .autoPagingToArray({limit: supported_payment_currencies.length*10});

    /*
     Use ShippingRate.fixed_amount.currency_options to provide different amounts for each currency. Updating them
     each with new values if they already exist, or creating new options for currencies that don't yet have a key.
     @see https://docs.stripe.com/api/shipping_rates/object
    */
    for (const shippingRate of shippingRates) {
        console.log(`Updating rates for ${shippingRate.display_name}: ${shippingRate.id}`)
        if (!shippingRate.fixed_amount) {
            console.warn(`Shipping rate ${shippingRate.display_name} had no \`fixed_amount\` 
            attached. <\ShippingRate ID: {shippingRate.id}>`)
            continue;
        }

        let new_currency_options: {[key: string]: CurrencyOptions} = {}
        if (shippingRate.fixed_amount.currency_options) {
            new_currency_options = {...shippingRate.fixed_amount.currency_options}
        }
        const dinero = DineroFactory({
            amount: shippingRate.fixed_amount.amount,
            currency: shippingRate.fixed_amount.currency as Currency
        })

        // Fetch new values for each currency
        for (const currency of supported_payment_currencies) {
            // Skip the base currency from the options
            if (currency === shippingRate.fixed_amount.currency) continue;

            // Convert and add
            const convDin = await convertDinero(dinero, currency as Currency)
            // TODO: Implement tax exclusivity for countries that need it
            new_currency_options[currency] = {amount: convDin.getAmount(), tax_behavior: "unspecified"}
        }
        // Update on Stripe
        await stripe.shippingRates.update(shippingRate.id, {fixed_amount: {currency_options: new_currency_options}})
    }
    const { next_run } = await request.json();
    console.log("Shipping rates updated! Next run at:", next_run);
}

export const config: Config = {
    schedule: "@daily"
}