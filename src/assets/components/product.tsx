import { useState, useEffect } from 'react';

import "../css/product.css"

type prodProps = {
  sku: number,
  name: string,
  price: number,
  images: image[],
}

type image = {
  id: number,
  image_url: string,
  display_order: number
}

type productInBasket = {
  sku: number,
  name: string,
  price: number,
  basketQuantity: number,
  images: image[]
}

export default function Product({ sku, name, price, images }: prodProps) {

  function BasketModifier0Quant() { // Simple Add To Basket Button
    return (
      <div className="basket-button" onClick={increment}>
        <img className="basket-icon" src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg"></img>
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
    setQuantity(quantity+1)
    setShowModifer(true)
    updateQuantityDisplay()
  }

  function decrement() {
    if (quantity > 0) {
      setQuantity(quantity-1)
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
    if (Number.isNaN(value)) {
      console.log("Invalid input, resetting to " + quantity)
      basketInput.value = quantity as unknown as string
      return
    }
    // Check number in range
    if (value > max_order) {
      basketInput.value = max_order as unknown as string
      setQuantity(max_order)
      return
    } else if (value <= 0) {
      basketInput.value = 0 as unknown as string
      setQuantity(0)
      setShowModifer(false)
      return
    }
    basketInput.value = value as unknown as string
    
    
    // Actually change the variable value
    setQuantity(value)
  }

  function setQuantity(quant: number) {
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

    localStorage.setItem("basket",
      JSON.stringify({"basket": basket})
    )
    setQuantityButActually(quant)
  }

  
  const [quantity, setQuantityButActually] = useState(0); // Current quantity of product order
  const [showModifier, setShowModifer] = useState(quantity > 0); // Current display mode
  const max_order = 10; // Maximum possible product order

  // Get image if it exists
  images.sort(compareImages)
  var imageURL: string | undefined
  if (images.length > 0) {
    imageURL = images[0].image_url
  } else {
    imageURL = undefined
  }

  // Format Price
  var string_price: string = "£" + price.toFixed(2)

  // Check if item already in basket
  useEffect(() => { // Only run on initial render
    var basketString: string | null = localStorage.getItem("basket")
    if (basketString) {
      var basket: Array<productInBasket> = JSON.parse(basketString).basket
      for (let i=0; i<basket.length; i++) {
        let item: productInBasket = basket[i]
        if (item.sku == sku) {
          setQuantityButActually(item.basketQuantity)
          setShowModifer(true)
          updateQuantityDisplay()
          break
        }
      }
    }
  }, [])


  return (
    <div className="product" id={"product-" + sku}>
      <div
        className="product-image-container"
        style={{
          backgroundImage: "url(" + imageURL + ")",
        }}
      >
        <div className="bg-blurrer"></div>
        <img className="product-image-main" src={imageURL} loading='lazy'></img>
        <div className="bg-blurrer"></div>
      </div>

      <div className="prod-footer">
        <div className="product-text">
          <p className="product-name">{name}</p>
          <p className="product-price">{string_price}</p>
        </div>

        <div className='basket-modifier'>
          {showModifier ? <BasketModifier/> : <BasketModifier0Quant/>}
        </div>

      </div>
    </div>
  )
}

function compareImages(a: image, b: image): number {
  if (a.display_order < b.display_order) {
    return -1;
  } else if (b.display_order < a.display_order) {
    return 1;
  }
  return 0;
}

