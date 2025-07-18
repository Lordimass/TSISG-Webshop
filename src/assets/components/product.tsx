import { useState, useEffect } from 'react';

import "../css/product.css"
import { setBasketStringQuantity } from '../utils';
import { product } from './products';
import { basket_icon, max_product_order } from '../consts';

type prodProps = {
  sku: number,
  name: string,
  price: number,
  images: image[],
  stock: number
}

export type image = {
  id: number,
  alt?: string,
  image_url: string,
  inserted_at: string,
  product_sku: number,
  display_order: number
}

export type productInBasket = {
  sku: number,
  name: string,
  price: number,
  basketQuantity: number,
  images: image[]
}

export type basket = productInBasket[]

type checkoutProductParams = {
  image: string
  name: string
  quantity: number
  total: number
  sku?: number
}

/**
 * I apologise sincerely for the following code.
 */
export default function Product({ product }: {product: product}) {
  // Redefining variables after changing parameter to accept
  // full product instead of just select information. Done to
  // avoid refactoring the whole component to use product.???
  const sku = product.sku;
  const name = product.name;
  const price = product.price;
  const images = product.images;
  let stock = product.stock;

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
      </div>
      <input 
        id={'basket-input-' + sku} 
        className='basket-input' 
        type='text'
        inputMode='numeric'
        onBlur={updateQuantity}
        defaultValue={quantity}
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
    var basketInput = document.getElementById("basket-input-" + sku);
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
    var basketString: string | null = localStorage.getItem("basket")
    if (!basketString) { // Create basket if it doesn't exist
      basketString = "{\"basket\": []}"
    }
    var basket: Array<productInBasket> = JSON.parse(basketString).basket;

    // Find product and set quantity
    var found: boolean = false
    for (let i = 0; i<basket.length; i++) {
      var item: productInBasket = basket[i]
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
        "images": images
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
    var basketString: string | null = localStorage.getItem("basket");
    if (basketString) {
      var basket: Array<productInBasket> = JSON.parse(basketString).basket;

      // Iterating through basket to find product
      for (let i=0; i<basket.length; i++) {
        var item: productInBasket = basket[i];
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

  window.addEventListener("basketUpdate", resetInputToBasket)

  // Get image if it exists
  var imageURL: string | undefined = getFirstImage(images)

  // Format Price
  var string_price: string = "£" + price.toFixed(2)

  // Check if item already in basket
  useEffect(() => {resetInputToBasket()}, [])

  return (
    <div className="product" id={"product-" + sku}>
      {/* Product Image + Link to dedicated product page*/}
      <div
        onClick={redirectToDedicatedPage}
        className="product-image-container"
        style={{
          backgroundImage: "url(" + imageURL + ")",
        }}
      >
        <div className="bg-blurrer"></div>
        <img className="product-image-main" src={imageURL}></img>
        <div className="bg-blurrer"></div>
      </div>

      {/* Bottom half of the product display */}
      <div className="prod-footer">
        <div className="product-text">
          {/* Product Name + Link to dedicated product page */}
          <p className="product-name" onClick={redirectToDedicatedPage}>
            {name}
          </p>
          <p className="product-price">{string_price}</p>
        </div>

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

export function BasketProduct({ sku, name, price, images }: prodProps) {
  function increment() { // Increase quantity of this product
    if (quantity >= max_order) {
      return
    }
    setBasketStringQuantity(quantity+1, sku, images, price, name)
    setQuantityButActually(quantity+1)
  }

  function decrement() {
    if (quantity > 0) {
      setBasketStringQuantity(quantity-1, sku, images, price, name)
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
      setBasketStringQuantity(max_order, sku, images, price, name)
      setQuantityButActually(max_order)
      return
    } else if (value <= 0) {
      setBasketStringQuantity(0, sku, images, price, name)
      setQuantityButActually(0)
      return
    }
    
    // Actually change the variable value
    setBasketStringQuantity(value, sku, images, price, name)
    setQuantityButActually(value)
  }
  
  function syncWithBasket() {
    // Resets the value in the HTMLInput to the value from the basket
    // Called whenever the basket gets updated from a different source
    var basketString: string | null = localStorage.getItem("basket");
    if (basketString) {
      var basket: Array<productInBasket> = JSON.parse(basketString).basket;
      for (let i=0; i<basket.length; i++) {
        var item: productInBasket = basket[i];
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
  var imageURL: string | undefined = getFirstImage(images);
  var string_price: string = "£" + price.toFixed(2);
  var max_order: number = 10;
  window.addEventListener("basketUpdate", syncWithBasket)

  useEffect(() => {syncWithBasket()}, [])


  return (
    <div className="basket-product" id={"product-" + sku}>
      <div
        className="basket-product-image-container"
        style={{
          backgroundImage: "url(" + imageURL + ")",
        }}
      >
        <div className="bg-blurrer basket-left-blurrer"></div>
        <img className="basket-product-image-main" 
          src={imageURL} 
          loading='lazy'
          alt={name}
        />
        <div className="bg-blurrer"></div>
      </div>

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
      <div className='checkout-product-image-container' style={{backgroundImage: "url("+image+")"}}>
        <div className="bg-blurrer"></div>
        <img src={image}/>
        <div className="bg-blurrer"></div>
      </div>
      <div className="checkout-product-text">
          <p>{name} (x{quantity})</p>
          <p className='checkout-product-price'>{"£" + total.toFixed(2)}</p>
          <p>{sku_string}</p>
      </div>
      {checkbox}
  </div>)
}


function getFirstImage(images: Array<image>) {
  images.sort(compareImages)
  var imageURL: string | undefined
  if (images.length > 0) {
    imageURL = images[0].image_url
  } else {
    imageURL = undefined
  }
  return imageURL
}

function compareImages(a: image, b: image): number {
  if (a.display_order < b.display_order) {
    return -1;
  } else if (b.display_order < a.display_order) {
    return 1;
  }
  return 0;
}