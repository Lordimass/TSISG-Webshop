import DineroFactory, {Currency, Dinero} from "dinero.js";
import {CURRENCY_SYMBOLS} from "@shared/consts/currencySymbols.ts";

/**
 * API Endpoint for currency conversion requests.
 * `{{from}}` will be converted to the currency code to be converted from.
 * `{{to}}` will be converted to the currency code to be converted to.
 */
export const CURRENCY_CONVERSION_ENDPOINT = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{{from}}.min.json"

/**
 * A mapping from currency strings to their conversion rates.
 */
export type ExchangeRates = {
    /** Date in YYYY-MM-DD format */
    date: string,
} & {
    /**
     * One `{{from}}` mapped to many `{{to}}` currencies
     * @example "gbp": {"1inch": 8.493, "aave": 0.06489, ...}
     */
    [key: string]: {
        [key: string]: number
    }
}

/**
 * Fetch the current exchange rates in relation to a currency.
 * @param from The currency to fetch exchange rates in relation to.
 */
export async function fetchExchangeRates(from: string): Promise<ExchangeRates> {
    const resp = await fetch(CURRENCY_CONVERSION_ENDPOINT.replace("{{from}}", from.toLowerCase()))
    if (!resp.ok) {
        throw new Error("Could not fetch conversion rates")
    } else {
        return await resp.json() as ExchangeRates
    }
}

/**
 * Convert between currencies
 * @param dinero An object representing the money amount to convert from.
 * @param to The currency to convert to.
 * @param exchangeRates Cached exchange rates if they exist, used to prevent fetching exchange rates all the time if
 * many conversions are needed.
 */
export async function convertDinero(dinero: Dinero, to: Currency, exchangeRates?: ExchangeRates): Promise<Dinero> {
    // Accept passed in conversion rates to save on API calls from instances where `sessionStorage` isn't available.
    if (!exchangeRates) {
        // Store current exchange rates in `sessionStorage` to save on API calls.
        let exchangeRatesString;
        try {
            exchangeRatesString = window.sessionStorage.getItem(`exchangeRates${dinero.getCurrency()}`);
        } catch (e: unknown) {
            if (!(e instanceof ReferenceError)) throw e
        }

        if (!exchangeRatesString) {
            exchangeRates = await fetchExchangeRates(dinero.getCurrency());
            try {
                window.sessionStorage.setItem(`exchangeRates${dinero.getCurrency()}`, JSON.stringify(exchangeRates));
            } catch (e: unknown) {
                if (!(e instanceof ReferenceError)) throw e
            }
        } else {
            exchangeRates = JSON.parse(exchangeRatesString);
        }
    }


    const rate = exchangeRates![dinero.getCurrency().toLowerCase()][to.toLowerCase()]
    return DineroFactory({
        amount: Math.round(dinero.getAmount() * rate),
        currency: to,
        precision: CURRENCY_SYMBOLS[dinero.getCurrency().toLowerCase() as keyof typeof CURRENCY_SYMBOLS]?.precision ?? 2,
    })
}