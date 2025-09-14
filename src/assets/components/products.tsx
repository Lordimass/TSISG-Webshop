import "../css/products.css"

import { use, useEffect, useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"
import { ProductData, ProductInBasket } from "../../lib/types";
import { compareProducts } from "../../lib/sortMethods";
import { productLoadChunks } from "../consts";
import { supabase } from "../../app";
import { useGetProducts, UseRPCReturn } from "../../lib/supabaseRPC";

export default function Products() {
    function incrementPage() {setPage(page + 1)}
    function decrementPage() {setPage(page - 1)}

    const [page, setPage] = useState(1)
    const getProductsResponse: UseRPCReturn = useGetProducts();
    const productData: Array<ProductData> = getProductsResponse.data || []
    const [products, setProducts] = useState<React.JSX.Element[]>([])
    const [pageCount, setPageCount] = useState(0)
    
    // Deactivate products with no images,
    // Products with active=false or stock=0 are excluded from the query.
    useEffect(() => {
        const activeProductData: Array<ProductData> = productData.filter(
            p => p.images && p.images.length >= 1
        );
        activeProductData.sort(compareProducts)

        // Create product elements if there are any products to display
        if (activeProductData.length<0) {
            setProducts([])
            setPageCount(0)
            return
        }
        
        let start: number = (page-1)*productLoadChunks
        let end: number = Math.min(page*productLoadChunks, activeProductData.length)

        const buildingProducts: React.JSX.Element[] = []
        for (let i=start; i < Math.min(end, activeProductData.length); i++) {
            let product: ProductData|null = activeProductData[i]
            if (!product) {
                continue;
            }

            if (!product.active) {
                end++
                continue;
            }
            
            const newProductComponent = <Product
                product={product}
                key={product.sku}
            />
            buildingProducts.push(newProductComponent)
        }
        setProducts(buildingProducts)
        
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
  if (!basketString) {
      return (<></>)
  }
  const basket: Array<ProductInBasket> = JSON.parse(basketString).basket
  const els: Array<React.JSX.Element> = []

  for (let i=0; i<basket.length; i++) {
    let imageURL: undefined | string = undefined
    const prod: ProductInBasket = basket[i]
    if (prod.images[0].name) {
        imageURL = supabase.storage
            .from("transformed-product-images")
            .getPublicUrl(prod.images[0].name.replace(/\.[^.]+$/, '.webp'))
            .data.publicUrl
    } else if (prod.images[0].image_url){ // Fallback to old system
        imageURL = prod.images[0].image_url
    } else { // Couldn't find an image at all... strange.
        imageURL = undefined
    }

    els.push(<CheckoutProduct product={prod}/>)
  }
  return (<div className="checkout-products">{els}</div>)
}