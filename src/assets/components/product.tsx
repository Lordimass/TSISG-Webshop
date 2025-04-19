import { useState, ReactElement } from 'react';

import "../css/product.css"

type prodProps = {
  sku: Number,
  name: String,
  price: Number
  images: image[]
}

type image = {
  id: number,
  image_url: string,
  display_order: number
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
    if (value > max_order || value < 0) {
      console.log("Out of range, resetting to " + quantity)
      basketInput.value = quantity as unknown as string
      return
    }
    basketInput.value = value as unknown as string
    
    
    // Actually change the variable value
    setQuantity(value)
  }

  
  const [quantity, setQuantity] = useState(0); // Current quantity of product order
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

  return (
    <div className="product" id={"product-" + sku}>
      <div
        className="product-image-container"
        style={{
          backgroundImage: "url(" + imageURL + ")",
        }}
      >
        <div className="bg-blurrer"></div>
        <img className="product-image-main" src={imageURL}></img>
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

