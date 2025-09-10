import { createContext, useContext, useEffect, useRef, useState } from "react"
import Footer from "../../assets/components/footer"
import Header from "../../assets/components/header"
import SquareImageBox from "../../assets/components/squareImageBox"
import { back_icon, basket_icon, blank_product, max_product_order } from "../../assets/consts"
import { setBasketStringQuantity } from "../../assets/utils"
import "./prodPage.css"
import Markdown from "react-markdown"
import { LoginContext, SiteSettingsContext } from "../../app"
import { ImageData, ProductData, ProductInBasket } from "../../lib/types"
import ProductEditor from "./productEditor/productEditor"
import { useGetProduct } from "../../lib/netlifyFunctions"
import { UnsubmittedProductData } from "./productEditor/types"

export const ProductContext = createContext<{
    basketQuant?: number, 
    setBasketQuant?: React.Dispatch<React.SetStateAction<number>>,
    setProduct?: React.Dispatch<React.SetStateAction<UnsubmittedProductData>>
    product: UnsubmittedProductData
    originalProd: ProductData
}>({product: blank_product, originalProd: blank_product});

export default function ProdPage() {
    const loginContext = useContext(LoginContext)

    // The sku of the product, extracted from the URL. Should always match product.sku
    const sku = extractSKU()
    // The number of this product in the basket
    const [basketQuant, setBasketQuant] = useState(0)
    // The product being viewed
    const [product, setProduct] = useState<UnsubmittedProductData>(blank_product);
    // Original prod used for reset buttons in editor
    const [originalProd, setOriginalProd] = useState<ProductData>(blank_product);
    // Ensure originalProd is only set once
    const originalProdSet = useRef(false);
    // Whether the user is logged in with edit permissions
    const [isEditMode, setIsEditMode] = useState(false)
    // Whether or not the product is out of stock. If so, basket modifier is disabled.
    const outOfStock = product.stock <= 0
    // Fetch product data from backend, then assign it to product state and originalProd if not already set
    const prod = useGetProduct(sku); 
    useEffect(() => {
        if (prod) {
            setProduct(prod)
            if (!originalProdSet.current) {
                setOriginalProd(structuredClone(prod))
                originalProdSet.current = true;
            }
        }
    }, [prod])
    // Set isEditMode based on loginContext permissions
    useEffect(() => setIsEditMode(loginContext.permissions.includes("edit_products")), [loginContext])

    const priceSplit = product.price.toString().split(".")
    const priceMajor = priceSplit[0]
    let priceMinorString = priceSplit[1]
    if (!priceMinorString) {
        priceMinorString = "0"
    }
    const priceMinor = priceMinorString.padEnd(2, "0")

    return (<><Header/><div className="content prodPage"><ProductContext.Provider value={{
        basketQuant, setBasketQuant, product, setProduct, originalProd}}>
        <a className="go-home-button" href="/">
            <img src={back_icon}/>
            <h1>Go Home</h1>
        </a>
        {isEditMode ? 
        <p className="logged-in-disclaimer">
            You see additional information on this page because you
            are <a href="/login">logged into</a> an account with special
            access.
        </p> : <></>}
        <div className="product-box">
            <div className="image">
                <SquareImageBox 
                    images={cleanseUnsubmittedProduct(product).images} 
                    size="100%" 
                    loading="eager"
                />
            </div>
            <h1 className="title">
                {product.name}
                {isEditMode ? <><br/><div className="sku">SKU{sku}</div></> : <></>}
            </h1>
            <h2 className="price">
                <span style={{fontSize: "0.7em"}}>£</span>
                {priceMajor}
                <span style={{fontSize: "0.6em", verticalAlign: "super"}}>{priceMinor}</span>
            </h2>
            <div className="tags">{product.tags.map((tag) => (
                <div className="tag" key={tag.name}>{tag.name}</div>
                ))}</div>
            <div className="desc">
                <Markdown>{product.description}</Markdown>
            </div>
            <QuantityTicker/>
        </div>

        {isEditMode ? <ProductEditor/> : <></>}
    </ProductContext.Provider></div><Footer/></>)
}


function QuantityTicker() {
    function increment() {
        if (basketQuant == undefined) {
            return
        }
        updateQuantity(basketQuant + 1)
    }

    function decrement() {
        if (basketQuant == undefined) {
            return
        }
        updateQuantity(basketQuant - 1)
    }

    function updateQuantity(newQuantity?: number) {
        if (basketQuant == undefined || !setBasketQuant || !product) {
            return
        }

        // No quantity supplied, will pull from text box
        if (newQuantity == null) {
            const basketElement: HTMLElement | null = document.getElementById("basket-input-" + product.sku)
            if (basketElement != null) {
                const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
                const contents: number = +basketInput.value
                newQuantity = Number.isNaN(contents) ? basketQuant : contents
            } else {
                newQuantity = 0
            }
        }

        // Validate new quantity is in range
        newQuantity = Math.max(0, newQuantity) // Lower Bounding
        newQuantity = Math.min(max_order, newQuantity) // Upper Bounding

        // Update Input Text Field if it exists
        // It may not exist if, e.g. basketQuant is 0
        setInputValue(newQuantity.toString())
        setBasketStringQuantity(cleanseUnsubmittedProduct(product), newQuantity)
        setBasketQuant(newQuantity)
    }

    /**
     * Resets the value in the HTMLInput to the value from the basket.
     * Run when the quantity of this product updates from some other source, like the basket.
     */
    function syncWithBasket() {
        if (basketQuant == null || !setBasketQuant || !product) {
            return
        }

        let basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;
            for (let i=0; i<basket.length; i++) {
                let item: ProductInBasket = basket[i];
                if (item.sku == product.sku) {
                    setBasketQuant(item.basketQuantity);

                    // Update basket input to be correct
                    const basketElement: HTMLElement | null = document.getElementById(
                        "basket-basket-input-" + product.sku
                    )
                    if (basketElement == null) {
                        return
                    }
                    const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
                    basketInput.value = item.basketQuantity.toString()
                    
                    // Update product input to be correct
                    setInputValue(item.basketQuantity.toString())
                    return
                }
            }
            // If we finish looking through and the product was not found, 
            // it must not be in the basket anymore, hence we set the quantity to 0
            setBasketQuant(0)
        }
    }

    function setInputValue(value: string) {
        const basketElement: HTMLElement | null = document.getElementById("basket-input-" + product?.sku)
        if (basketElement != null) {
            const basketInput: HTMLInputElement = basketElement as HTMLInputElement;
            basketInput.value = value
        }
    }

    const {basketQuant, setBasketQuant, product} = useContext(ProductContext)
    const [disabled, setDisabled] = useState(true)
    useEffect(() => {
        const disabled = product.stock <= 0 
            || product.active === false 
            || (siteSettings.kill_switch?.enabled ?? false)
        console.log(disabled)
        setDisabled(disabled)
        // If the product is disabled, ensure the basket quantity is 0
        if (disabled && product.sku != 0) {
            console.log("Product disabled, setting basket quantity to 0")
            setBasketStringQuantity(cleanseUnsubmittedProduct(product), 0)
            setBasketQuant?.(0)
        }
    }, [product])
    const siteSettings = useContext(SiteSettingsContext)

    // Figure out whether the product is disabled, and set a message to show if so.
    let disabledMessage
    if (disabled && product.name != "...") {
        
        // Delay slightly to avoid react state update errors

        const msgs = siteSettings.disabled_product_messages
        if (msgs && msgs.out_of_stock && msgs.disabled) {
            // Set message to display to user.
            disabledMessage = !product.active 
            ? msgs.disabled
            : product.stock <= 0
                ? msgs.out_of_stock
                : (siteSettings.kill_switch) && siteSettings.kill_switch.enabled
                    ? siteSettings.kill_switch.message
                    : "This product is unavailable" // Fallback, should never be seen
        }
    }

    const max_order = Math.min(max_product_order, product.stock)
    
    useEffect(() => {
        window.addEventListener("basketUpdate", syncWithBasket)
        return () => window.removeEventListener("basketUpdate", syncWithBasket)
    }, [])
    
    if (basketQuant == 0) { // Quant0Modifier
        return (<div>
        <p>{disabledMessage}</p>
        <button 
            className="basket-button prod-page-basket-button" 
            onClick={()=>updateQuantity(1)}
            disabled={disabled}
        >
            <img className="basket-icon" src={basket_icon}></img>
            <h1>+</h1>
        </button>
        </div>)
    } else { // Standard Basket Modifier
        return (<div className='basket-modifier prod-page-modifier'>
        <div className='decrement-basket-quantity-button' onClick={decrement}>
            <h1>-</h1>
        </div>
        <input 
            id={'basket-input-' + product.sku} 
            className='basket-input' 
            type='text'
            inputMode='numeric'
            onBlur={()=>{updateQuantity()}}
            defaultValue={basketQuant}
        />
        <div className='increment-basket-quantity-button' onClick={increment}>
            <h1>+</h1>
        </div>
        </div>)
    }
}

/**
 * Extract the product SKU from the URL
 */
function extractSKU(): number {
    // SKU is the last part of the subdirectory
    const path = window.location.pathname.split("/")
    const skuString = path[path.length-1]
    // Convert to number type and return
    return skuString as unknown as number; 
}

/**
 * Removes unsubmitted types from the product data,
 * leaving a clean ProductData type to use in other
 * places. This is useful to, for example, remove
 * unsubmitted images before updating the basket
 */
export function cleanseUnsubmittedProduct(product: UnsubmittedProductData): ProductData {
    const cleansedImages: ImageData[] = product.images.filter((img) => "id" in img)
    return {...product, images: cleansedImages}
}