import { createContext, useContext, useEffect, useRef, useState } from "react"
import Footer from "../../assets/components/footer"
import Header from "../../assets/components/header"
import { product } from "../../assets/components/products"
import SquareImageBox from "../../assets/components/squareImageBox"
import { back_icon, basket_icon, max_product_order } from "../../assets/consts"
import { setBasketStringQuantity, useGetProduct } from "../../assets/utils"
import "./prodPage.css"
import { productInBasket } from "../../assets/components/product"
import Markdown from "react-markdown"

const ProductContext = createContext<{
    basketQuant: number | undefined, 
    setBasketQuant: React.Dispatch<React.SetStateAction<number>> | undefined,
    product: product | undefined
}>({basketQuant: undefined, setBasketQuant: undefined, product: undefined});

export default function ProdPage() {
    const sku = extractSKU()

    const [basketQuant, setBasketQuant] = useState(0)
    const [product, setProduct] = useState<product|null>(null);
    const prod = useGetProduct(sku)
    useEffect(() => {setProduct(prod)})

    if (!product) {
        return
    }

    const priceSplit = product.price.toString().split(".")
    const priceMajor = priceSplit[0]
    let priceMinorString = priceSplit[1]
    if (!priceMinorString) {
        priceMinorString = "0"
    }
    const priceMinor = priceMinorString.padEnd(2, "0")
    
    
    return (<><Header/><div className="content prodPage"><ProductContext value={{
        basketQuant, setBasketQuant, product}}>
        <a className="go-home-button" href="/">
            <img src={back_icon}/>
            <h1>Go Home</h1>
        </a>
        <div className="product-box">
            <div className="image"><SquareImageBox images={product.images} size="100%"/></div>
            <h1 className="title">{product.name}</h1>
            <h2 className="price">
                <span style={{fontSize: "0.7em"}}>£</span>
                {priceMajor}
                <span style={{fontSize: "0.6em", verticalAlign: "super"}}>{priceMinor}</span>
            </h2>
            <div className="desc">
                <Markdown>{product.description}</Markdown>
            </div>
            <div className="spacer"/>
            <QuantityTicker/>
        </div>
    </ProductContext></div><Footer/></>)
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

        setBasketStringQuantity(
            newQuantity, 
            product.sku, 
            product.images, 
            product.price, 
            product.name
        )
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
            var basket: Array<productInBasket> = JSON.parse(basketString).basket;
            for (let i=0; i<basket.length; i++) {
                var item: productInBasket = basket[i];
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