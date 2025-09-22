import { useState, useEffect, useContext } from 'react';

import "../css/product.css"
import { setBasketStringQuantity } from '../utils';
import { basket_icon, blank_product, max_product_order } from '../consts';
import { CategoryData, ImageData, OrderProduct, ProductData, ProductInBasket } from '../../lib/types';
import SquareImageBox from './squareImageBox';
import { getImageURL, getRepresentativeImageURL } from '../../lib/lib';
import { ProductContext } from '../../pages/products/lib';

/**
 * I apologise sincerely for the following code.
 */
export default function Product({ prod }: {prod: ProductData | ProductData[]}) {
  // Redefining variables after changing parameter to accept
  // full product instead of just select information. Done to
  // avoid refactoring the whole component to use product.???
  let sku: number, name: string, price: number, images: ImageData[], stock: number|undefined, category: CategoryData;
  let group = false
  let product: ProductData[] | ProductData = blank_product
  if ("length" in prod && prod.length === 1) product = prod[0]
  else product = prod
  
  if (!("length" in product)) { // Product is not in a group
    sku = product.sku
    name = product.name
    price = product.price
    images = product.images
    stock = product.stock
    group = true
  } else { // Product is in a group
    product = product as unknown as ProductData[]
    sku = product[0].sku
    name = product[0].group_name!
    price = product[0].price
    images = product[0].images
    category = product[0].category
  }

  if (stock && stock < 0) {stock = 0}

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
    if (!max_order || quantity >= max_order) {
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
    if (group) {return}
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
    if (+value > max_order!) {
      basketInput.value = max_order as unknown as string
      setBasketStringQuantity(max_order!)
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
    if (group) {return}
    // Function needs to update the localStorage basket for persistence,
    // it will also then update the actual quantity state for this product.

    // Fetch the current basket contents
    let basketString: string | null = localStorage.getItem("basket")
    let freshBasket = false
    if (!basketString || basketString == "{\"basket\":[]}" || basketString == "{}") { // Create basket if it doesn't exist
      basketString = `{"basket": []}`
      freshBasket = true
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
        "stock": stock!,
        "category": category
      })
    }

    // Save to localStorage
    localStorage.setItem("basket",
      JSON.stringify(freshBasket 
        ? {"basket": basket, "lastUpdated": (new Date()).toISOString()} 
        : {"basket": basket})
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
  
  const [quantity, setQuantityButActually] = useState(0); // Current quantity of product order
  const [showModifier, setShowModifer] = useState(quantity > 0); // Current display mode
  const max_order = stock ? Math.min(max_product_order, stock): undefined; // Maximum possible product order
  const imageURL = getRepresentativeImageURL(prod)

  window.addEventListener("basketUpdate", resetInputToBasket)

  // Format Price
  const string_price: string = "£" + price.toFixed(2)

  // Check if item already in basket
  useEffect(() => {resetInputToBasket()}, [])

  return (<ProductContext.Provider value={{
    basketQuant: quantity, setBasketQuant: setQuantityButActually,
    product: "length" in product ? product[0] : product, setProduct: undefined,
    group: "length" in product ? product : [],
    originalProd: "length" in product ? product[0] : product,
    hoveredVariant: undefined,
    setHoveredVariant: undefined
  }}>
    <div className="product" id={"product-" + sku}>
      {/* Product Image + Link to dedicated product page*/}   
      <a className="product-image-link" href={"/products/"+sku}>
        <SquareImageBox image={imageURL} size='100%'/>
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
          {group
            ? showModifier 
              ? <BasketModifier/> 
              : <BasketModifier0Quant/>
            : <GroupBasketModifier/>
          }
        </div>
      </div>
    </div>
    
  </ProductContext.Provider>)
}

function GroupBasketModifier() {
  const {product} = useContext(ProductContext)
  return (
    <a className="basket-button" href={`/products/${product.sku}`}>
      <p>View Options <i className="fi fi-rr-angle-right"></i></p>
    </a>
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
  window.addEventListener("basketUpdate", syncWithBasket)
  useEffect(() => {syncWithBasket()}, [])

  return (
    <div className="basket-product" id={"product-" + sku}>
      <SquareImageBox image={imageURL} size='100%' loading='eager'/>

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

/**
 * @param product The product to display
 * @param admin Whether the product should be rendered in admin mode or not
 * @param checkbox Whether to display a checkbox alongside the product, for ticking off lists etc.
 * @param linked Whether the product should be clickable to go to its product page
 */
export function CheckoutProduct({
  product,
  admin,
  checkbox,
  linked
} : {
  product: ProductData | ProductInBasket | OrderProduct
  admin?: boolean
  checkbox?: boolean
  linked?: boolean
}) {
  // In some cases an undefined value may accidentally be passed
  // to the component, in which case we should escape it and 
  // render nothing, it will likely become defined once the page
  // fully loads.
  if (!product) return <></>
  const sku = product.sku
  const name = "name" in product ? product.name : product.product_name
  const quantity = "basketQuantity" in product 
    ? product.basketQuantity 
    : "quantity" in product
      ? product.quantity
      : undefined 
  const total = "line_value" in product 
    ? product.line_value 
    : quantity
      ? product.price * quantity
      : product.price

  let image = "image_url" in product 
    ? product.image_url 
    : getImageURL(product.images?.[0]);
  
  let href = linked 
    ? `/products/${sku}`
    : undefined;

  if (image == "") image = undefined
  
  return (<a className="checkout-product" href={href}>
      <SquareImageBox image={image} size='100%' loading='eager'/>
      <div className="checkout-product-text">
          {quantity ? <p>{name} (x{quantity})</p> : <p>{name}</p>}
          <p className='checkout-product-price'>{"£" + total.toFixed(2)}</p>
          {admin ? <p>SKU: {sku}</p> : <></>}
      </div>
      {checkbox ? <><div className='product-filler'/><input type='checkbox' className='product-checkbox'/></> : <></>}
  </a>)
}