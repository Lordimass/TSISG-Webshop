import { supabaseAnon } from "./getSupabaseClient.ts";
import type { ImageData } from "@shared/types/supabaseTypes.ts";
import {Stripe} from "stripe";
import ShippingCurrencyOptions = Stripe.ShippingRate.FixedAmount.CurrencyOptions
import PriceCurrencyOptions = Stripe.ProductCreateParams.DefaultPriceData.CurrencyOptions
import DineroFactory, {Currency} from "dinero.js";
import {ConversionRates, convertDinero} from "@shared/functions/price.ts";
import {stripe} from "./stripe.ts";

/**
 * Checks if two objects contain the same data
 * @param obj1 First object
 * @param obj2 Second object
 * @returns True if objects are equal, false otherwise
 */
export function checkObjectsEqual(obj1: any, obj2: any) {
    const obj1Length = Object.keys(obj1).length;
    const obj2Length = Object.keys(obj2).length;

    if(obj1Length === obj2Length) {
        return Object.keys(obj1).every(
            key => obj2.hasOwnProperty(key)
                && obj2[key] === obj1[key]);
    }
    return false;
}

/**
 * Sends a GA4 event.
 * @param payload - The event payload.
 * @param event - The event name.
 * @param debug - Whether to enable debug mode. Enabling this prevents events from
 * being ingested, meaning they won't show up in DebugView.
 */
export async function sendGA4Event(payload: any, debug=false) {
    const response = await fetch(`https://region1.google-analytics.com/${debug ? "debug/" : ""}mp/collect?api_secret=${process.env.GA4_MEASUREMENT_PROTOCOL_SECRET}&measurement_id=${process.env.VITE_GA4_MEASUREMENT_ID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        console.error("Failed to send GA4 event: ", response.statusText)
    } else {
        console.log("Successfully sent GA4 event", response.status, response.statusText)
        if (debug) console.log("GA4 Debug Response:", await response.json())
    }
}

/**
 * Gets the public URL of a product image
 * @param image The image data
 * @param highres Whether to get the non-compressed version of the image
 * @returns The public URL of the image, or undefined if not found
 */
export function getImageURL(image: ImageData, highres = false): string | undefined {
  if (!image) return undefined
  if (image.name) {
    return (supabaseAnon.storage
    .from(highres ? "product-images" : "transformed-product-images")
    .getPublicUrl(highres ? image.name : image.name.replace(/\.[^.]+$/, '.webp'))
    .data.publicUrl)
  } else if (image.image_url){ // Fallback to old system
    return image.image_url
  } else { // Couldn't find an image at all... strange.
    return undefined
  }
}

/**
 * Converts an ISO8601 duration to a duration in milliseconds.
 * @param duration An ISO8601 duration string.
 * @returns `duration` in milliseconds.
 */
export function parseDuration(duration: string): number {
  if (!duration) {console.error(`No duration supplied`); return NaN}
  const regex =
    /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

  const match = duration.match(regex);
  if (!match) return NaN;

  const [,
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
  ] = match.map((v) => (v ? parseFloat(v) : 0));

  const ms =
    years * 31536000000 +
    months * 2592000000 +
    days * 86400000 +
    hours * 3600000 +
    minutes * 60000 +
    seconds * 1000;

  return ms;
}

type CurrencyOptionType = "SHIPPING" | "PRODUCT"
type CurrencyOptions<T extends CurrencyOptionType> =
    T extends "PRODUCT" ? { [key: string]: PriceCurrencyOptions } :
    T extends "SHIPPING" ? { [key: string]: ShippingCurrencyOptions } :
    never
/**
 * Generate price points for all of Stripe's supported currencies (ex. base currency).
 * @param price The price point in base currency in cents
 * @param type Whether the currency options are for shipping rates or product prices, since structure is marginally
 * different between the two (for some reason...)
 * @param baseCurrency The currency of `price`
 * @param cachedExchangeRates Cached conversion rates to prevent having to fetch new ones
 */
export async function generateStripeCurrencyOptions<T extends CurrencyOptionType>(
    price: number,
    type: T,
    baseCurrency: Currency = "GBP",
    cachedExchangeRates?: ConversionRates
):
    Promise<CurrencyOptions<T>>
{
    process.stdout.write("Generating currency options... ")
    const {supported_payment_currencies} = await stripe.countrySpecs.retrieve("GB")

    let new_currency_options: CurrencyOptions<T> = {} as CurrencyOptions<T>
    const dinero = DineroFactory({
        amount: price,
        currency: baseCurrency
    })

    // Fetch new values for each currency
    for (const currency of supported_payment_currencies) {
        // Skip the base currency from the options
        if (currency === baseCurrency.toLowerCase()) continue;

        // Convert and add
        const convDin = await convertDinero(dinero, currency as Currency, cachedExchangeRates)
        if (convDin.getAmount() > 99999999) {
            // Skip currencies where converted currency leads to numbers too large for Stripe request.
            continue;
        }
        // TODO: Implement tax exclusivity for countries that need it
        if (type === "SHIPPING") {
            new_currency_options[currency] = {amount: convDin.getAmount(), tax_behavior: "unspecified"}
        } else {
            new_currency_options[currency] = {unit_amount: convDin.getAmount(), tax_behavior: "unspecified"}
        }

    }
    process.stdout.write("\r\x1b[K") // Clear line
    return new_currency_options
}