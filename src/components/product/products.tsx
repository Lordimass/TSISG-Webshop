import "./products.css"

import {JSX, useContext, useEffect, useState} from "react";
import Product from "./product";
import {GenericSingleProduct, ProductData} from "@shared/types/types";
import {productLoadChunks} from "../../lib/consts.ts";
import {triggerViewItemList} from "../../lib/analytics/analytics";
import {LocaleContext} from "../../localeHandler.ts";
import {Currency} from "dinero.js";
import {getBasketProducts} from "../../lib/lib.tsx";

import {PageSelector} from "../ticker/pageSelector/pageSelector.tsx";
import {useGenerateProductComponents} from "./lib.tsx";

/** Display paginated available products from Supabase */
export default function Products() {
    const {currency} = useContext(LocaleContext)

    const [page, setPage] = useState(1)
    const [prodComponents, setProdComponents] = useState<JSX.Element[]>([])

    const products = useGenerateProductComponents();
    const pageCount = Math.ceil(products.length/productLoadChunks)
    
    useEffect(() => {
        let toShow: typeof products = products.slice(
            (page-1) * productLoadChunks,
            page * productLoadChunks
        );
        const components: JSX.Element[] = [];
        const prodObjs: ProductData[] = [];
        toShow.forEach(mapping => {
            components.push(mapping.component)
            prodObjs.push(...mapping.prod)
        })

        triggerViewItemList(
            prodObjs,
            `home_page_${page}`,
            `Home Page ${page}`,
            currency
        ).then()

        setProdComponents(components)

    }, [products, page])

    return (<div className="products-box">
    <div className='products'>{prodComponents}</div>
        <PageSelector
            id="product-list-page-selector"
            pageCount={pageCount}
            onChange={e => setPage(e)}
        />
    </div>)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/** An ordered list of products from the user's basket without quantity tickers */
export function CheckoutProducts({currency, prods}: {
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency,
    /** Override the product list to display. Used to display a list of products other than the current basket, based on localStorage */
    prods?: GenericSingleProduct[]
}) {
    const basket = prods ?? getBasketProducts();
    return (<div className="checkout-products">{basket.map(
            prod => <Product prod={prod} currency={currency} key={prod.sku} quantityLocked horizontal/>
        )}</div>
    )
}