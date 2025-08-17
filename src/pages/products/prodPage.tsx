import { createContext, useContext, useEffect, useState } from "react"
import Footer from "../../assets/components/footer"
import Header from "../../assets/components/header"
import SquareImageBox from "../../assets/components/squareImageBox"
import { back_icon, basket_icon, blank_product, max_product_order } from "../../assets/consts"
import { setBasketStringQuantity, useGetProduct } from "../../assets/utils"
import "./prodPage.css"
import Markdown from "react-markdown"
import { LoginContext } from "../../app"
import { ProductData, ProductInBasket } from "../../lib/types"
import { getImageURL } from "../../lib/lib"
import ProductEditor from "./productEditor"

export const ProductContext = createContext<{
    basketQuant?: number, 
    setBasketQuant?: React.Dispatch<React.SetStateAction<number>>,
    setProduct?: React.Dispatch<React.SetStateAction<ProductData>>
    product: ProductData
    originalProd: ProductData
}>({product: blank_product, originalProd: blank_product});

export default function ProdPage() {
    const loginContext = useContext(LoginContext)

    const sku = extractSKU()
    const [basketQuant, setBasketQuant] = useState(0)
    const [product, setProduct] = useState<ProductData>(blank_product);
    // Original prod used for reset buttons in editor
    const [originalProd, setOriginalProd] = useState<ProductData>(blank_product);
    const [isEditMode, setIsEditMode] = useState(false)
    const prod = useGetProduct(sku); 
    useEffect(() => {
        if (prod) {
            setProduct(prod)
            setOriginalProd(prod)
        }
    }, [prod])
    useEffect(() => setIsEditMode(loginContext.permissions.includes("edit_products")), [loginContext])

    const priceSplit = product.price.toString().split(".")
    const priceMajor = priceSplit[0]
    let priceMinorString = priceSplit[1]
    if (!priceMinorString) {
        priceMinorString = "0"
    }
    const priceMinor = priceMinorString.padEnd(2, "0")

    const [images, setImages] = useState<{ image_url?: string, alt?: string }[]>([])
    useEffect(() => {
        if (product) {
            setImages(product.images.map((image) => {
                return {
                    image_url: getImageURL(image),
                    alt: image.alt
                }
            }))
        }
    }, [product])
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
            <div className="image"><SquareImageBox images={images} size="100%"/></div>
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

        setBasketStringQuantity(product, newQuantity)
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

        var basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            var basket: Array<ProductInBasket> = JSON.parse(basketString).basket;
            for (let i=0; i<basket.length; i++) {
                var item: ProductInBasket = basket[i];
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

    // By default these are undefined, so need to escape that
    if (basketQuant == undefined || !setBasketQuant || !product) { 
        return
    }

    const max_order = Math.min(max_product_order, product?.stock)
    window.addEventListener("basketUpdate", syncWithBasket)
    useEffect(() => {syncWithBasket()}, [])
    
    if (basketQuant == 0) { // Quant0Modifier
        return (
        <div className="basket-button prod-page-basket-button" onClick={()=>updateQuantity(1)}>
            <img className="basket-icon" src={basket_icon}></img>
            <h1>+</h1>
        </div>
        )
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