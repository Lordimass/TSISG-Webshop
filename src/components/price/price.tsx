import DineroFactory, {Dinero} from "dinero.js";
import {useEffect, useState} from "react";
import {convertDinero} from "./lib.tsx";

import "./price.css"

export default function Price({baseDinero}: {baseDinero: Dinero}) {
    // TODO: Convert to the user's local currency
    useEffect(() => {
        async function convert() {
            const convertedDinero = await convertDinero(baseDinero, "EUR")
            setConverted(convertedDinero)
        }
        convert()
    }, []);

    const [converted, setConverted] = useState<Dinero>()
    const dinero = converted ?? baseDinero

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