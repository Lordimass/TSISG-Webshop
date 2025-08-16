import { useState, useEffect } from 'react';

import "../css/product.css"
import { setBasketStringQuantity } from '../utils';
import { basket_icon, max_product_order } from '../consts';
import { ImageData, ProductData, ProductInBasket } from '../../lib/types';
import { supabase } from '../../app';
import SquareImageBox from './squareImageBox';
import { getImageURL } from '../../lib/lib';

type prodProps = {
  sku: number,
  name: string,
  price: number,
  images: ImageData[],
  stock: number
}

type checkoutProductParams = {
  image?: string
  name: string
  quantity: number
  total: number
  sku?: number
}

/**
 * I apologise sincerely for the following code.
 */
export default function Product({ product }: {product: ProductData}) {
  // Redefining variables after changing parameter to accept
  // full product instead of just select information. Done to
  // avoid refactoring the whole component to use product.???
  let {sku, name, price, images, stock} = product;

  if (stock < 0) {stock = 0}

  function BasketModifier0Quant() { // Simple Add To Basket Button
    return (
      <div className="basket-button" onClick={increment}>
        <img className="basket-icon" src={basket_icon}></img>
        <h1>+</h1>
      </div>
    )
  }

  function BasketModifier() { // Text field and increment/decrement buttons
    return (<>
      <div className='decrement-basket-quantity-button' onClick={decrement}>
        <h1>-</h1>
      </div><input 
        id={'basket-input-' + sku} 
        className='basket-input' 
        type='text'
        inputMode='numeric'
        onBlur={updateQuantity}
        defaultValue={quantity}
        aria-label='Quantity'
      />
      <div className='increment-basket-quantity-button' onClick={increment}>
        <h1>+</h1>
      </div>
    </>)
  }

  function increment() { // Increase quantity of this product
    if (quantity >= max_order) {
      return
    }
    setBasketStringQuantity(quantity+1)
    setShowModifer(true)
    updateQuantityDisplay()
  }

  function decrement() {
    if (quantity > 0) {
      setBasketStringQuantity(quantity-1)
    }

    if (quantity <= 1) {
      setShowModifer(false)
    }
  }

  function updateQuantityDisplay() {
    // Updating the value displayed in the quantity box
    let basketInput = document.getElementById("basket-input-" + sku);
    if (basketInput == null) {
      return
    }
    (basketInput as HTMLInputElement).value = quantity.toString()
  }

  function updateQuantity() {
    // Fetch HTMLElement
    const basketElement: HTMLElement | null = document.getElementById("basket-input-" + sku)
    if (basketElement == null) {
      console.error("Couldn't find input box for product-"+sku)
      return
    }

    // Cast to HTMLInputElement
    const basketInput: HTMLInputElement = basketElement as HTMLInputElement;

    // Convert value to an integer
    const value: number = parseInt(basketInput.value)

    // Check input valid
    if (Number.isNaN(+value)) {
      basketInput.value = quantity as unknown as string
      return
    }
    // Check number in range
    if (+value > max_order) {
      basketInput.value = max_order as unknown as string
      setBasketStringQuantity(max_order)
      return
    } else if (+value <= 0) {
      basketInput.value = 0 as unknown as string
      setBasketStringQuantity(0)
      setShowModifer(false)
      return
    }
    basketInput.value = +value as unknown as string
    
    
    // Actually change the variable value
    setBasketStringQuantity(+value)
  }

  function setBasketStringQuantity(quant: number) {
    // Function needs to update the localStorage basket for persistence,
    // it will also then update the actual quantity state for this product.

    // Fetch the current basket contents
    let basketString: string | null = localStorage.getItem("basket")
    if (!basketString) { // Create basket if it doesn't exist
      basketString = "{\"basket\": []}"
    }
    let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;

    // Find product and set quantity
    let found: boolean = false
    for (let i = 0; i<basket.length; i++) {
      let item: ProductInBasket = basket[i]
      if (item.sku == sku) {
        found = true
        // Just remove it from the basket if 0
        if (quant == 0) {
          basket.splice(i, 1)
          break
        }
        item.basketQuantity = quant
        break
      }
    }
    // If it wasn't found, create it
    if (!found) {
      basket.push({
        "sku": sku,
        "name": name,
        "price": price,
        "basketQuantity": quant,
        "images": images,
        "stock": stock
      })
    }

    // Save to localStorage
    localStorage.setItem("basket",
      JSON.stringify({"basket": basket})
    )
    window.dispatchEvent(new CustomEvent("basketUpdate"))
    setQuantityButActually(quant)
  }

  function resetInputToBasket() {
    // Resets the value in the HTMLInput to the value from the basket
    // Called whenever the basket gets updated.

    // Getting basket
    let basketString: string | null = localStorage.getItem("basket");
    if (basketString) {
      let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;

      // Iterating through basket to find product
      for (let i=0; i<basket.length; i++) {
        let item: ProductInBasket = basket[i];
        if (item.sku == sku) {
          // Set quantity variable to match basket
          setQuantityButActually(item.basketQuantity);

          if (item.basketQuantity > 0) {
            setShowModifer(true)
          } else {
            setShowModifer(false)
          }

          // Update HTMLInput if it exists
          const basketElement: HTMLElement | null = document.getElementById("basket-input-" + sku)
          if (basketElement != null) {
            const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
            basketInput.value = item.basketQuantity as unknown as string
          }
          return
        }
      }

      // Run when not found in basket
    
      // Update HTMLInput to 0 if it exists
      const basketElement: HTMLElement | null = document.getElementById("basket-input-" + sku)
      if (basketElement != null) {
        const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
        basketInput.value = "0"
      }
      setShowModifer(false)
      setQuantityButActually(0)
    }
  }

  /**
   * Redirect user to the dedicated page for this product, also adds
   */
  function redirectToDedicatedPage() {
    window.location.href = "/products/"+sku;
  }
  
  const [quantity, setQuantityButActually] = useState(0); // Current quantity of product order
  const [showModifier, setShowModifer] = useState(quantity > 0); // Current display mode
  const max_order = Math.min(max_product_order, stock); // Maximum possible product order
  const [imageURL, setImageURL] = useState(supabase.storage
    .from("transformed-product-images")
    .getPublicUrl(product.images[0].name.replace(/\.[^.]+$/, '.webp'))
    .data.publicUrl
  )

  window.addEventListener("basketUpdate", resetInputToBasket)

  // Check if transformed image exists, and fallback to untransformed if not
  useEffect(() => {
    async function exists(path: string) {
      const { data, error } = await supabase
        .storage
        .from("transformed-product-images")
        .list('', { search: path });

      if (error) {
        console.error(error);
        return false;
      }
      
      const exist = data.some((item: { name: string; }) => item.name === path);
      if (!exist) {
        setImageURL(supabase.storage
          .from("product-images")
          .getPublicUrl(product.images[0].name)
          .data.publicUrl)
      }
    }
    exists(product.images[0].name.replace(/\.[^.]+$/, '.webp'))
  }, [])

  // Format Price
  const string_price: string = "£" + price.toFixed(2)

  // Check if item already in basket
  useEffect(() => {resetInputToBasket()}, [])

  return (
    <div className="product" id={"product-" + sku}>
      {/* Product Image + Link to dedicated product page*/}   
      <a className="product-image-link" href={"/products/"+sku}>
        <SquareImageBox image_url={imageURL} size='100%'/>
      </a>

      {/* Bottom half of the product display */}
      <div className="prod-footer">
        <div className="product-text">
          {/* Product Name + Link to dedicated product page */}
          <a className="product-name" href={"/products/"+sku}>
            {name}
          </a>
          <p className="product-price">{string_price}</p>
        </div>
        <div className='spacer'/>
        <div className='basket-modifier'>
          {showModifier ? <BasketModifier/> : <BasketModifier0Quant/>}
        </div>
      </div>
    </div>
  )
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function BasketProduct({ product }: {product: ProductInBasket}) {
  const { sku, name, price, images, stock } = product
  function increment() { // Increase quantity of this product
    if (quantity >= max_order) {
      return
    }
    setBasketStringQuantity(product, quantity+1)
    setQuantityButActually(quantity+1)
  }

  function decrement() {
    if (quantity > 0) {
      setBasketStringQuantity(product, quantity-1)
      setQuantityButActually(quantity-1)
    }
  }

  function updateQuantity() {
    // Updating quantity based on the contents of the HTMLInput

    // Fetch HTMLElement
    const basketElement: HTMLElement | null = document.getElementById("basket-basket-input-" + sku)
    if (basketElement == null) {
      console.error("Couldn't find input box for basket-product-"+sku)
      return
    }
    const basketInput: HTMLInputElement = basketElement as HTMLInputElement;

    // Convert value to an integer
    const value: number = parseInt(basketInput.value)

    // Check input valid
    if (Number.isNaN(value)) {
      console.log("Invalid input, resetting to " + quantity)
      basketInput.value = quantity as unknown as string
      return
    }
    // Check number in range
    if (value > max_order) {
      setBasketStringQuantity(product, max_order)
      setQuantityButActually(max_order)
      return
    } else if (value <= 0) {
      setBasketStringQuantity(product, 0)
      setQuantityButActually(0)
      return
    }
    
    // Actually change the variable value
    setBasketStringQuantity(product, value)
    setQuantityButActually(value)
  }
  
  function syncWithBasket() {
    // Resets the value in the HTMLInput to the value from the basket
    // Called whenever the basket gets updated from a different source
    let basketString: string | null = localStorage.getItem("basket");
    if (basketString) {
      let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;
      for (let i=0; i<basket.length; i++) {
        let item: ProductInBasket = basket[i];
        if (item.sku == sku) {
          setQuantityButActually(item.basketQuantity);
          const basketElement: HTMLElement | null = document.getElementById("basket-basket-input-" + sku)
          if (basketElement == null) {
            return
          }
          const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
          basketInput.value = item.basketQuantity as unknown as string
          return
        }
      }
    }
  }

  const [quantity, setQuantityButActually] = useState(0);
  const [imageURL, setImageURL] = useState<undefined | string>(undefined)
  // If the user's basket is yet to be updated with new data (from old system using image_url)
  // images[0].name will be undefined, so it has to check its existence first.
  useEffect(() => {
    setImageURL(getImageURL(images[0]))
  }, [])

  let string_price: string = "£" + price.toFixed(2);
  let max_order: number = Math.min(max_product_order, stock);
  console.log()
  window.addEventListener("basketUpdate", syncWithBasket)

  // Check if transformed image exists, and fallback to untransformed if not
  useEffect(() => {
    async function exists(path: string) {
      const { data, error } = await supabase
        .storage
        .from("transformed-product-images")
        .list('', { search: path });

      if (error) {
        console.error(error);
        return false;
      }
      
      const exist = data.some((item: { name: string; }) => item.name === path);
      if (!exist) {
        setImageURL(supabase.storage
          .from("product-images")
          .getPublicUrl(images[0].name)
          .data.publicUrl)
      }
    }
    if (!images[0].name) return
    exists(images[0].name.replace(/\.[^.]+$/, '.webp'))
  }, [])

  useEffect(() => {syncWithBasket()}, [])

  return (
    <div className="basket-product" id={"product-" + sku}>
      <SquareImageBox image_url={imageURL} size='100%' loading='eager'/>

      <div className="basket-prod-footer">
        <div className="basket-product-text">
          <p className="product-name">{name}</p>
          <p className="product-price">{string_price}</p>
        </div>

        <div className='basket-modifier'>
          <div className='decrement-basket-quantity-button' onClick={decrement}>
            <h1>-</h1>
          </div>
          <input 
            id={'basket-basket-input-' + sku} 
            className='basket-input' 
            type='text'
            inputMode='numeric'
            onBlur={updateQuantity}
            defaultValue={quantity}
            aria-label='Quantity'
          />
          <div className='increment-basket-quantity-button' onClick={increment}>
            <h1>+</h1>
          </div>
        </div>

      </div>
    </div>
  )
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export function CheckoutProduct({image, name, quantity, total, sku}: checkoutProductParams) {
  // This component is used by the staff-portal order manager too,
  // Extra information is shown in this view
  const sku_string = sku ? "SKU: " + sku : null
  const checkbox = sku ? 
  <><div className='product-filler'/><input type='checkbox' className='product-checkbox'/></> :
  null
  
  return (<div className="checkout-product">
      <SquareImageBox image_url={image} size='100%' loading='eager'/>
      <div className="checkout-product-text">
          <p>{name} (x{quantity})</p>
          <p className='checkout-product-price'>{"£" + total.toFixed(2)}</p>
          <p>{sku_string}</p>
      </div>
      {checkbox}
  </div>)
}