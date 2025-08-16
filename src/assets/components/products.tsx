import "../css/products.css"

import { useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"
import { useGetProductList } from "../utils";
import { ProductData, ProductInBasket } from "../../lib/types";
import { compareProducts } from "../../lib/sortMethods";
import { productLoadChunks } from "../consts";
import { supabase } from "../../app";

export default function Products() {
    function incrementPage() {
        setPage(page + 1)
    }

    function decrementPage() {
        setPage(page - 1)
    }

    const [page, setPage] = useState(1)
    const productData: Array<ProductData> = useGetProductList();
    if (!productData) { // List not loaded yet
      return <></>
    }
    var products: Array<React.JSX.Element> = [];
    let pageCount = 0;

    // Deactivate products with no images,
    // Products with active=false or stock=0 are excluded from the query.
    const activeProductData: Array<ProductData> = []
    for (let i=0; i<productData.length; i++) {
        const product = productData[i]
        const active = product.images.length>=1; 
        if (active) {
            activeProductData.push(product)
        }
    }
    activeProductData.sort(compareProducts)

    // Create product elements if there are any products to display
    if (activeProductData.length>0) {
        var start: number = (page-1)*productLoadChunks
        var end: number = Math.min(page*productLoadChunks, activeProductData.length)

        for (let i=start; i < Math.min(end, activeProductData.length); i++) {
          let product: ProductData|null = activeProductData[i]
          if (!product) {
            continue;
          }

          if (!product.active) {
            end++
            continue;
          }
          products.push(<Product
              product={product}
              key={product.sku}
          />)
        }
        
        pageCount = Math.floor(activeProductData.length/productLoadChunks);
        if (productData.length % productLoadChunks != 0) {
            pageCount++
        }

    } else {
        products = []
        pageCount = 0
    }


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

    els.push(<CheckoutProduct
        image = {imageURL}
        name = {prod.name}
        quantity={prod.basketQuantity}
        total = {prod.price*prod.basketQuantity}
        key={prod.sku}
    />)
  }
  return (<div className="checkout-products">{els}</div>)
}