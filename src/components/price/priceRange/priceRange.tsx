import DineroFactory from "dinero.js";
import Price from "../price.tsx";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import "./priceRange.css"

/**
 * Displays a price range for a group of products, or a single price if all products have the same price.
 * @param prods The product group to get the price range of.
 * @constructor
 */
export default function PriceRange({prods}: {prods: ProductData[]}) {
    let minPrice = Number.MAX_SAFE_INTEGER;
    let maxPrice = 0;
    prods.forEach(prod => {
        const price = Math.round(prod.price * 100)
        minPrice = Math.min(minPrice, price);
        maxPrice = Math.max(maxPrice, price);
    })
    if (minPrice == maxPrice) {
        return <Price baseDinero={DineroFactory({amount: minPrice, currency: "GBP", precision: 2})}/>
    } else {
        return <div className="price-range">
            <p className="price-range-p">From</p>
            <Price baseDinero={DineroFactory({amount: minPrice, currency: "GBP", precision: 2})} simple={true}/>
        </div>
    }
}