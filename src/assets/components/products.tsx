import "../css/products.css"

import { useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"
import { getProductList } from "../utils";
import { ProductData, ProductInBasket } from "../../lib/types";
import { compareImages, compareProducts } from "../../lib/sortMethods";

const productLoadChunks: number = 20;

export default function Products() {
    function incrementPage() {
        setPage(page + 1)
    }

    function decrementPage() {
        setPage(page - 1)
    }

    const [page, setPage] = useState(1)
    const productData: Array<ProductData> = getProductList();
    var products: Array<React.JSX.Element> = [];
    let pageCount = 0;

    // Deactivate products with no images,
    // Products with active=false or stock=0 are excluded from the query.
    const activeProductData: Array<ProductData> = []
    for (let i=0; i<productData.length; i++) {
        const product = productData[i]
        const active = product.images.length>=1; 
        if (active) {
            product.images.sort(compareImages)
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
              prod={product}
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
      const item: ProductInBasket = basket[i]
      els.push(<CheckoutProduct
          image = {item.images[0]?.image_url}
          name = {item.name}
          quantity={item.basketQuantity}
          total = {item.price*item.basketQuantity}
          key={item.sku}
      />)
  }
  return (<div className="checkout-products">{els}</div>)
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////