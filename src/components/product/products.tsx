import "./products.css"

import {JSX, ReactNode, useContext, useEffect, useState} from "react";
import Product, {ProductGroup} from "./product";
import { CheckoutProduct } from "./product"
import {ProductData} from "@shared/types/types";
import { compareProductGroups, compareProducts } from "../../lib/sortMethods";
import { productLoadChunks } from "../../lib/consts.ts";
import { useGetGroupedProducts } from "../../lib/supabaseRPC";
import { triggerViewItemList } from "../../lib/analytics/analytics";
import {LocaleContext} from "../../localeHandler.ts";
import {Currency} from "dinero.js";
import {getBasketProducts} from "../../lib/lib.tsx";

import {PageSelector} from "../ticker/pageSelector/pageSelector.tsx";

/** Display all available products from Supabase */
export default function Products() {
    const {currency} = useContext(LocaleContext)

    const [page, setPage] = useState(1)
    const [pageCount, setPageCount] = useState(0)
    const [products, setProducts] = useState<JSX.Element[]>([])

    const getProductsResponse = useGetGroupedProducts(undefined, true, true);
    const productGroups: ProductData[][] = getProductsResponse.data || []
    
    useEffect(() => {
        // Don't show products with no images
        const activeProductData: ProductData[][] = productGroups.filter(group => {
            const images = group.map(p => p.images).flat(1)
            return images.length > 0;
        });
        // Sort groups, then sort the products within those groups.
        activeProductData.sort(compareProductGroups)
        activeProductData.forEach((group) => {group.sort(compareProducts)})

        // If there are no active products, just return.
        if (activeProductData.length === 0) return

        // Chunk the products into pages to avoid displaying them all at once.
        let start: number = (page-1)*productLoadChunks
        let end: number = Math.min(page*productLoadChunks, activeProductData.length)

        const productComponents: JSX.Element[] = []
        const displayedProducts: ProductData[] = []
        for (let i=start; i < Math.min(end, activeProductData.length); i++) {
            let group: ProductData[] | null = activeProductData[i]
            if (!group || group.length === 0) continue;

            let newProductComponent: ReactNode
            if (group.length === 1) {
                newProductComponent = <Product prod={group[0]} key={group[0].sku}/>
            } else {
                newProductComponent = <ProductGroup prods={group} key={group[0].group_name}/>
            }

            productComponents.push(newProductComponent)
            displayedProducts.push(...group)
        }
        setProducts(productComponents)
        triggerViewItemList(
            displayedProducts,
            `home_page_${page}`,
            `Home Page ${page}`,
            currency
        ).then()
        
        let pageCount = Math.floor(activeProductData.length/productLoadChunks);
        if (activeProductData.length % productLoadChunks != 0) {
            pageCount++;
        }
        setPageCount(pageCount);

    }, [getProductsResponse.loading, page])

    return (<div className="products-box">
    <div className='products'>{products}</div>
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
export function CheckoutProducts({currency}: {
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency
}) {
  const basket = getBasketProducts();
  return (<div className="checkout-products">{basket.map(
      prod => <CheckoutProduct product={prod} key={prod.sku} currency={currency}/>)}</div>
  )
}