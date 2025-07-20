import { useEffect, useState } from "react";
import PageSelector from "./pageSelector";
import Product from "./product";
import { CheckoutProduct } from "./product"

import { productInBasket, image } from "./product";

import "../css/products.css"
import { useGetProductList } from "../utils";

export type product = {
  /** Unique identification number, arbitrary length */
  sku: number,
  /** Time at which the product was added to the database as an ISO date string */
  inserted_at: string,
  /** Time at which the product was fetched from the database as an ISO date string, representative of when this data was last confirmed valid */
  fetched_at: string,
  /** The time which this data was last edited as an ISO date string. */
  last_edited: string
  /** Customer facing name of the product */
  name: string,
  /** Price of product in GBP inc. Tax */
  price: number,
  /** How many of the product are available to buy, accurate at fetched_at */
  stock: number,
  /** Whether or not the product is currently able to be added to baskets. Does <i>not</i> stop the product from being bought if it's already in the basket */
  active: boolean,
  /** Weight of one of this product in grams */
  weight?: number, 
  customs_description?: string,
  origin_country_code?: string,
  sort_order: number,
  package_type_override?: string,
  images: image[],
  /** The ID of the category that this product is placed in <br/> DEPRECATED: Please use category.id */
  category_id: number,
  category: {
    id: number,
    created_at: string,
    name: string,
    description?: string
  }
  description?: string
  tags: {
    id: number,
    created_at: string,
    name: string
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
    const productData: Array<product> = useGetProductList();
    if (!productData) { // List not loaded yet
      return <></>
    }
    var products: Array<React.JSX.Element> = [];
    let pageCount = 0;

    // Deactivate products with no images,
    // Products with active=false or stock=0 are excluded from the query already.
    const activeProductData: Array<product> = []
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
          let product: product|null = activeProductData[i]
          if (!product) {
            continue;
          }

          if (!product.active) {
            end++
            continue;
          }
          products.push(<Product
              key={product.sku}
              product={product}
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

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function compareProducts(a: product, b: product) {
    // Primary: Sort by sort_order
    if (a.sort_order < b.sort_order) return -1
    if (a.sort_order > b.sort_order) return 1
    // Secondary: Sort by category
    if (a.category_id < b.category_id) return -1
    if (a.category_id > b.category_id) return 1
    // Tertiary: Sort alphabetically
    return a.name.localeCompare(b.name)
}