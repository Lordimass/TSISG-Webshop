import {Currency, Dinero} from "dinero.js";
import {useContext, useEffect, useState} from "react";

import "./price.css"
import {LocaleContext} from "../../localeHandler.ts";
import {convertDinero} from "@shared/functions/price.ts";
import {CURRENCY_SYMBOLS} from "@shared/consts/currencySymbols.ts";

/**
 * Price display in user's local currency.
 * @param baseDinero Dinero object representing the price to display to the user.
 * @param currency Override currency to display.
 * @param simple Display currency in a simpler format, with a constant font size and no currency code indicator
 * only use if you want this currency to show instead of the user's local currency.
 */
export default function Price({baseDinero, currency, simple}: {baseDinero: Dinero, currency?: Currency, simple?: boolean}) {
    const {currency: defaultCurrency} = useContext(LocaleContext);
    const curr = currency ?? defaultCurrency;

    useEffect(() => {
        async function convert() {
            if (curr === baseDinero.getCurrency()) {
                setDinero(baseDinero);
            }
            const convertedDinero = await convertDinero(baseDinero, curr)
            setDinero(convertedDinero)
        }
        convert()
    }, [curr, baseDinero]);

    const [dinero, setDinero] = useState<Dinero>(baseDinero);

    // Extract major and minor currency amounts
    const formatString = dinero.toFormat('0.00')
    const [major, minor] = formatString.split('.')
    const symbol = currency && Object.keys(CURRENCY_SYMBOLS).includes(currency.toUpperCase())
        ? CURRENCY_SYMBOLS[currency.toUpperCase() as keyof typeof CURRENCY_SYMBOLS].symbol
        : dinero.toFormat(`$0.00`).charAt(0)

    if (!simple) {
        return <div className="price">
            <div className="price-left">
                <p className="price-symbol">{symbol}</p>
                <p className="price-currency">{dinero.getCurrency().toUpperCase()}</p>
            </div>
            <p className="price-major">{major}</p>
            <p className="price-minor">{minor}</p>
        </div>
    } else {
        return <p>{symbol}{major}.{minor}</p>
    }

}