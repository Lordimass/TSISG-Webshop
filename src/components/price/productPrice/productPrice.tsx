import DineroFactory from "dinero.js";
import Price from "../price.tsx";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import "./productPrice.css"
import {DEFAULT_CURRENCY} from "../../../localeHandler.ts";

function ProductPriceRange({prods}: {prods: ProductData[]}) {
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;
    prods.forEach(prod => {
        const price = Math.round(prod.price * 100)
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
    })
    if (minPrice == maxPrice) {
        return <Price baseDinero={DineroFactory({amount: minPrice, currency: DEFAULT_CURRENCY, precision: 2})}/>
    } else {
        return <div className="price-range">
            <p className="price-range-p">From</p>
            <Price baseDinero={DineroFactory({amount: minPrice, currency: DEFAULT_CURRENCY, precision: 2})} simple={true}/>
        </div>
    }
}

/**
 * Displays a price (or price range) for a given product or product group.
 * @param prod A single product or group of products for which to display a price.
 * @constructor
 */
export function ProductPrice({prod}: {prod: ProductData | ProductData[]}) {
    // Product group
    if (Array.isArray(prod) && prod.length > 1) {
        return <ProductPriceRange prods={prod}/>
    }
    // Single product in a group
    else if (Array.isArray(prod)) {
        prod = prod[0];
    }

    const dinero = DineroFactory({
        amount: Math.round(prod.price*100),
        currency: DEFAULT_CURRENCY,
        precision: 2
    });
    return <Price baseDinero={dinero}/>
}