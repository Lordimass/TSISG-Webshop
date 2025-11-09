import DineroFactory, {Dinero} from "dinero.js";

type Currency = DineroFactory.Currency

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
     * One {{from}} mapped to many {{to}} currencies
     * e.g. "gbp": {"1inch": 8.493, "aave": 0.06489, ...}
     */
    [key: string]: {
        [key: string]: number
    }
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
        currency: to
    })
}