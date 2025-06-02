import { useEffect, useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"

import { productInBasket, image } from "./product";

import "../css/products.css"
import { getProductList } from "../utils";

type prodDataElement = {
  sku: number,
  price: number,
  name: string,
  stock: number,
  active: boolean
  images: {
    id: number,
    image_url: string,
    display_order: number
  }[]
}

const productLoadChunks: number = 20;

export default function Products() {
    function incrementPage() {
        setPage(page + 1)
    }

    function decrementPage() {
        setPage(page - 1)
    }

    const [page, setPage] = useState(1)
    const productData: Array<prodDataElement> = getProductList();
    var products: Array<React.JSX.Element> = [];
    let pageCount = 0;

    const activeProductData: Array<prodDataElement> = []
    for (let i=0; i<productData.length; i++) {
        const product = productData[i]
        const active = product.active && product.stock > 1;
        if (active) {
            activeProductData.push(product)
        }
    }


    if (activeProductData) {
        console.log(activeProductData)
        var start: number = (page-1)*productLoadChunks
        var end: number = Math.min(page*productLoadChunks, activeProductData.length)

        for (let i=start; i < Math.min(end, activeProductData.length); i++) {
          let product: prodDataElement|null = activeProductData[i]
          if (!product) {
            continue;
          }

          if (!product.active) {
            end++
            continue;
          }
          products.push(<Product
              key={product.sku}
              sku={product.sku}
              name={product.name}
              price={product.price}
              images={product.images}
              stock={product.stock}
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
  const basket: Array<productInBasket> = JSON.parse(basketString).basket
  const els: Array<React.JSX.Element> = []

  for (let i=0; i<basket.length; i++) {
      const item: productInBasket = basket[i]
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