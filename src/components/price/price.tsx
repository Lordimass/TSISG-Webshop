import {Dinero} from "dinero.js";
import {useContext, useEffect, useState} from "react";
import {convertDinero} from "./lib.tsx";

import "./price.css"
import {LocaleContext} from "../../localeHandler.ts";

export default function Price({baseDinero}: {baseDinero: Dinero}) {
    const {currency} = useContext(LocaleContext);

    useEffect(() => {
        async function convert() {
            if (currency === baseDinero.getCurrency()) {
                setDinero(baseDinero);
            }
            const convertedDinero = await convertDinero(baseDinero, currency)
            setDinero(convertedDinero)
        }
        convert()
    }, [currency, baseDinero]);

    const [dinero, setDinero] = useState<Dinero>(baseDinero);

    // Extract major and minor currency amounts
    const formatString = dinero.toFormat('0.00')
    const [major, minor] = formatString.split('.')
    const symbol = dinero.toFormat(`$0.00`).charAt(0)

    return <div className="price">
        <div className="price-left">
            <p className="price-symbol">{symbol}</p>
            <p className="price-currency">{dinero.getCurrency()}</p>
        </div>
        <p className="price-major">{major}</p>
        <p className="price-minor">{minor}</p>
    </div>
}