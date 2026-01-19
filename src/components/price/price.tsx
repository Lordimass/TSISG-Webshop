import {Currency, Dinero} from "dinero.js";
import {useContext, useEffect, useState} from "react";

import "./price.css"
import {LocaleContext} from "../../localeHandler.ts";
import {convertDinero} from "@shared/functions/price.ts";
import {CURRENCY_SYMBOLS, TAX_EXCLUSIVE_COUNTRIES} from "@shared/consts/currencySymbols.ts";

/**
 * Price display in user's local currency, or any custom currency supplied through the `currency` property.
 */
export default function Price({baseDinero, currency, simple = false, noConversion = false}: {
    /** Dinero object representing the price to display to the user. */
    baseDinero: Dinero,
    /** Choose a currency to display other than that of the user's local currency. */
    currency?: Currency,
    /** Display baseDinero as is, with no conversion */
    noConversion?: boolean
    /** Display currency in a simpler format, with a constant font size and no currency code indicator */
    simple?: boolean
}
) {
    const {currency: defaultCurrency, locale, country} = useContext(LocaleContext);
    const curr = currency ?? defaultCurrency;

    useEffect(() => {
        async function convert() {
            if (curr === baseDinero.getCurrency() || noConversion) {
                setDinero(baseDinero);
            } else {
                const convertedDinero = await convertDinero(baseDinero, curr)
                setDinero(convertedDinero)
            }
        }
        convert().then()
    }, [baseDinero.getCurrency(), baseDinero.getAmount(), curr, noConversion]);

    const [dinero, setDinero] = useState<Dinero>(baseDinero);

    // Extract major and minor currency amounts
    const formatString = dinero.toFormat('0.00')
    const [major, minor] = formatString.split('.')
    const symbol = Object.keys(CURRENCY_SYMBOLS).includes(curr.toUpperCase())
        ? CURRENCY_SYMBOLS[curr.toUpperCase() as keyof typeof CURRENCY_SYMBOLS].symbol
        : dinero.toFormat(`$0.00`).charAt(0)

    if (!simple) {
        return <div className="price">

            <div className="price-left">
                <p className="price-symbol">{symbol}</p>
                <p className="price-currency">{curr.toUpperCase()}</p>
            </div>

            <p className="price-major">{Number(major).toLocaleString(locale)}</p>
            {dinero.getPrecision()>0 ? <p className="price-minor">{minor}</p> : null}

            {/* Disclaimer for tax-exclusive countries that prices here are tax-inclusive */
                TAX_EXCLUSIVE_COUNTRIES.includes(country)
                ? <p className="price-tax-disclaimer">inc. tax</p>
                : null
            }

        </div>
    } else {
        return <p>{symbol}{
            Number(`${major}.${minor}`
            )
            .toLocaleString(
                locale,
                {minimumFractionDigits: dinero.getPrecision()}
            )
        }</p>
    }
}