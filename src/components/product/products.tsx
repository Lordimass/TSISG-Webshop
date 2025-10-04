import "./products.css"

import {useEffect, useState } from "react";
import PageSelector from "../pageSelector/pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"
import { Basket, ProductData } from "../../lib/types";
import { compareProductGroups, compareProducts } from "../../lib/sortMethods";
import { productLoadChunks } from "../../lib/consts";
import { useGetGroupedProducts } from "../../lib/supabaseRPC";
import { triggerViewItemList } from "../../lib/analytics/analytics";

export default function Products() {
    function incrementPage() {setPage(page + 1)}
    function decrementPage() {setPage(page - 1)}

    const [page, setPage] = useState(1)
    const getProductsResponse = useGetGroupedProducts(undefined, true, true);
    const productGroups: ProductData[][] = getProductsResponse.data || []
    const [products, setProducts] = useState<React.JSX.Element[]>([])
    const [pageCount, setPageCount] = useState(0)
    
    useEffect(() => {
        // Don't show products with no images
        const activeProductData: ProductData[][] = productGroups.filter(group => {
            const images = group.map(p => p.images).flat(1)
            return images.length > 0;
        });
        activeProductData.sort(compareProductGroups)
        activeProductData.forEach((group) => {group.sort(compareProducts)})

        // Create product elements if there are any products to display
        if (activeProductData.length<0) {
            setProducts([])
            setPageCount(0)
            return
        }
        
        let start: number = (page-1)*productLoadChunks
        let end: number = Math.min(page*productLoadChunks, activeProductData.length)

        const productComponents: React.JSX.Element[] = []
        const displayedProducts: ProductData[] = []
        for (let i=start; i < Math.min(end, activeProductData.length); i++) {
            let group: ProductData[]|null = activeProductData[i]
            if (!group || group.length === 0) continue;
            
            const newProductComponent = <Product
                prod={group}
                key={group[0].sku}
            />
            productComponents.push(newProductComponent)
            displayedProducts.push(...group)
        }
        setProducts(productComponents)
        triggerViewItemList(displayedProducts, `home_page_${page}`, `Home Page ${page}`)
        
        let pageCount = Math.floor(activeProductData.length/productLoadChunks);
        if (activeProductData.length % productLoadChunks != 0) {
            pageCount++;
        }
        setPageCount(pageCount);

    }, [getProductsResponse.loading, page])

    return (<div className="products-box">
    <div className='products'>{products}</div>
    <PageSelector 
        incrementCallback={incrementPage} 
        decrementCallback={decrementPage}
        min={1}
        max={pageCount}  
    />
    </div>)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CheckoutProducts() {
  const basketString: string | null = localStorage.getItem("basket")
  if (!basketString) {return (<></>)}
  const basket: Basket = JSON.parse(basketString).basket
  return (<div className="checkout-products">{basket.map((prod) => <CheckoutProduct product={prod} key={prod.sku}/>)}</div>)
}