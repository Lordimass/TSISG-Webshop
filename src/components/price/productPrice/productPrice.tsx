import DineroFactory, {Currency} from "dinero.js";
import Price from "../price.tsx";
import {OrderProdCompressed, ProductData} from "@shared/types/supabaseTypes.ts";
import "./productPrice.css"
import {DEFAULT_CURRENCY} from "../../../localeHandler.ts";
import {ProductInBasket} from "@shared/types/types.ts";

/** Displays a price (or price range) for a given product or product group. */
export function ProductPrice({prod, currency}: {
    /** The product or product group to display a price for */
    prod: ProductData | ProductInBasket | OrderProdCompressed | ProductData[]
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency
}) {
    // Product group
    if (Array.isArray(prod) && prod.length > 1) return <ProductPriceRange prods={prod}/>
    // Single product in a group
    else if (Array.isArray(prod)) prod = prod[0];

    const price = "price" in prod ? prod.price : prod.line_value
    const dinero = DineroFactory({
        amount: Math.round(price*100),
        currency: DEFAULT_CURRENCY,
        precision: 2
    });
    return <Price baseDinero={dinero} currency={currency}/>
}

/** Display a price range for a group of products, or a single price if all the products have the same price. */
function ProductPriceRange({prods, currency}: {
    /** Product group to display a price range for. */
    prods: ProductData[]
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency
}) {
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;
    prods.forEach(prod => {
        const price = Math.round(prod.price * 100)
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
    })
    if (minPrice == maxPrice) {
        return <Price
            baseDinero={DineroFactory({amount: minPrice, currency: DEFAULT_CURRENCY, precision: 2})}
            currency={currency}
        />
    } else {
        return <div className="price-range">
            <p className="price-range-p">From</p>
            <Price
                baseDinero={DineroFactory({amount: minPrice, currency: DEFAULT_CURRENCY, precision: 2})}
                simple={true}
                currency={currency}
            />
        </div>
    }
}