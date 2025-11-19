import DineroFactory, {Currency, Dinero} from "dinero.js";

/**
 * API Endpoint for currency conversion requests.
 * `{{from}}` will be converted to the currency code to be converted from.
 * `{{to}}` will be converted to the currency code to be converted to.
 */
export const CURRENCY_CONVERSION_ENDPOINT = "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/{{from}}.min.json"

type ConversionRates = {
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

/** Maps currencies to precisions, if their precision differs from 2
 *
 * > *A precision, expressed as an integer, to represent the number of decimal places in the amount. This is helpful
 * when you want to represent fractional minor currency units (e.g.: $10.4545). You can also use it to represent a
 * currency with a different exponent than 2 (e.g.: Iraqi dinar with 1000 fils in 1 dinar (exponent of 3), Japanese
 * yen with no subunits (exponent of 0)).*
 * \- [dinerojs.com](https://dinerojs.com/module-dinero#main)
 * @example "JPY": 0
 * */
const PRECISION_MAP: {[currency: string]: number} = {
    "BIF": 0,
    "CLP": 0,
    "DJF": 0,
    "GNF": 0,
    "JPY": 0,
    "KMF": 0,
    "KRW": 0,
    "MGA": 0,
    "PYG": 0,
    "RWF": 0,
    "UGX": 0,
    "VND": 0,
    "VUV": 0,
    "XAF": 0,
    "XOF": 0,
    "XPF": 0,
    "BHD": 3,
    "IQD": 3,
    "KWD": 3
}

async function fetchExchangeRates(from: string): Promise<ConversionRates> {
    const resp = await fetch(CURRENCY_CONVERSION_ENDPOINT.replace("{{from}}", from.toLowerCase()))
    if (!resp.ok) {
        throw new Error("Could not fetch conversion rates")
    } else {
        return await resp.json() as ConversionRates
    }
}

export async function convertDinero(dinero: Dinero, to: Currency): Promise<Dinero> {
    let exchangeRates: ConversionRates;

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

    const rate = exchangeRates[dinero.getCurrency().toLowerCase()][to.toLowerCase()]
    return DineroFactory({
        amount: Math.round(dinero.getAmount() * rate),
        currency: to,
        precision: PRECISION_MAP[to] ?? 2,
    })
}