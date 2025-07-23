import { createContext, useContext, useEffect, useRef, useState } from "react"
import Footer from "../../assets/components/footer"
import Header from "../../assets/components/header"
import { product } from "../../assets/components/products"
import SquareImageBox from "../../assets/components/squareImageBox"
import { back_icon, basket_icon, blank_product, EditableProductProp, editableProductProps, max_product_order } from "../../assets/consts"
import { fetchFromNetlifyFunction, getJWTToken, setBasketStringQuantity, softParseJSON, useGetProduct } from "../../assets/utils"
import "./prodPage.css"
import { productInBasket } from "../../assets/components/product"
import Markdown from "react-markdown"
import { LoginContext } from "../../main"
import { notify } from "../../assets/components/notification"

const ProductContext = createContext<{
    basketQuant?: number, 
    setBasketQuant?: React.Dispatch<React.SetStateAction<number>>,
    setProduct?: React.Dispatch<React.SetStateAction<product>>
    product: product
    originalProd: product
}>({product: blank_product, originalProd: blank_product});

const EditableProductPropContext = createContext<{
    originalProd: product
    product: product,
    setProduct?: React.Dispatch<React.SetStateAction<product>>
    productProp?: EditableProductProp
}>({product: blank_product, originalProd: blank_product})

export default function ProdPage() {
    const loginContext = useContext(LoginContext)

    const sku = extractSKU()
    const [basketQuant, setBasketQuant] = useState(0)
    const [product, setProduct] = useState<product>(blank_product);
    // Original prod used for reset buttons in editor
    const [originalProd, setOriginalProd] = useState<product>(blank_product);
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
            <div className="image"><SquareImageBox images={product.images} size="100%"/></div>
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
                <div className="tag" key={tag.id}>{tag.name}</div>
                ))}</div>
            <div className="desc">
                <Markdown>{product.description}</Markdown>
                {/*<pre>{JSON.stringify(product, null, 2)}</pre> DEBUG LINE*/} 
            </div>
            <QuantityTicker/>
        </div>

        {isEditMode ? <ProductEditor/> : <></>}
    </ProductContext.Provider></div><Footer/></>)
}

function ProductEditor() {
    async function fetchNewData() {
        const response = await fetchFromNetlifyFunction("getProduct", JSON.stringify({sku: product.sku}))
        if (!response.error && response.data && setProduct) {
            setProduct(response.data)
        }
        
    }

    const {product, setProduct, originalProd} = useContext(ProductContext)
    if (!product) {
        return
    }

    return (<div className="product-editor">
        <div className="product-editor-grid">
            {editableProductProps.map((productProp) => 
            <EditableProductPropContext.Provider 
                value={{product, setProduct, productProp, originalProd}} 
                key={productProp.propName}
            >
                <EditableProdPropBox fetchNewData={fetchNewData}/>
            </EditableProductPropContext.Provider>)}
        </div>
        <button className="refresh-product" onClick={fetchNewData}>Refresh Data</button>
    </div>)
}

function EditableProdPropBox({fetchNewData}: {fetchNewData: () => Promise<void>}) {
    /**
     * Updates the given product live on screen and internally within Supabase.
     * @param key A keyof the product type as a string. The key of the value to change
     * @param value The new value to map the key to. Automatically parsed to the right type for the given key
     * @param constraint A boolean method which returns true if the value is valid, false if not.
     */
    async function updateProduct(key: keyof product, value: any, constraint: (value: string) => boolean) {
        function assignTypedValue<K extends keyof product>( // Parse string to right type using mapped parser from productTypeMap
            key: K,
            val: string,
            target: Partial<product>
        ) {
        const parser = productTypeMap[key];
        if (parser) {
            target[key] = parser(val);
        } else { // Fallback to raw string if no parser provided
            target[key] = val as product[K]
        }
        }

        const valid = constraint(value)
        if (!valid) {
            notify(`Value for ${key} is invalid.`)
            return
        }
        if (!setProduct) {return}

        const newProduct: product = {...product}
        assignTypedValue(key, value, newProduct)

        // Get JWT Access Token to authorise updating database
        const jwt = await getJWTToken(); 
        try {
            const res = await fetch(window.location.origin + '/.netlify/functions/updateProductData', {
            method: 'POST',
            headers: {Authorization: `Bearer ${jwt}`},
            body: JSON.stringify(newProduct),
            });

            const body = softParseJSON(await res.text())
            if (!res.ok) {
                console.error(body)
                notify(body.message ? body.message : body)
                return
            } else {
                console.log(body)
            }
        } catch (err: any) {
            console.error(err);
            notify(err.toString())
            return
        }

        setProduct(newProduct)
        fetchNewData()
    }

    const loginContext = useContext(LoginContext)
    const inputBox = useRef<HTMLTextAreaElement>(null);
    const {product, productProp, setProduct, originalProd} = useContext(EditableProductPropContext)
    const [editable, setEditable] = useState(false);

    if (!productProp) {
        return
    }

    // Set edit permissions
    useEffect(()=>{
        productProp.permission ? 
        setEditable(loginContext.permissions.includes(productProp.permission)) :
        setEditable(loginContext.permissions.includes("edit_products"))
    }, [loginContext])

    // Auto-resize text field when value changes
    useEffect(() => {
        if (inputBox.current && productProp) {
            const newVal = product[productProp?.propName]
            inputBox.current.value = newVal ? newVal.toString() : ""
            autoResizeTextarea(inputBox.current)
        }
    }, [product])

    

    return <div className="editable-prop" id={productProp.propName.toString()+"-editable-prop"}>
        <div className="editable-prop-title">
            {productProp.displayName}
            {productProp.tooltip ? <span className="superscript tooltipable">[?]<span className="tooltip">{productProp.tooltip}</span></span> : <></>}
        </div>
        <div className="editable-prop-input-box">
            {productProp.prefix ? <p>{productProp.prefix}</p> : <></>}
            <textarea 
                className="prop-editor-input"
                id={productProp.propName.toString()+"-editor-input"}
                defaultValue={product[productProp.propName] || product[productProp.propName] == null ? product[productProp.propName]?.toString() : "Error: Invalid Key Value"}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                ref={(el) => {autoResizeTextarea(el); inputBox.current = el}}
                disabled={!editable}
            />
            {productProp.postfix ? <p>{productProp.postfix}</p> : <></>}
        </div>
        <div className="prop-buttons">
            <button 
                className="update-prop-button" 
                onClick={() => {updateProduct(productProp.propName, inputBox.current?.value, productProp.constraint)}}
                disabled={!editable}
            >Update</button>
            <button 
                className="reset-prop-button" 
                onClick={() => {updateProduct(productProp.propName, originalProd[productProp.propName], () => true)}}
                disabled={!editable}
            >Reset</button>
        </div>
    </div>
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

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (el) {
    el.style.height = 'auto'; // Reset
    el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
  }
}

// Mapping of keys for the product type to parsers to convert from strings to the respective type for that key
const productTypeMap: Partial<Record<keyof product, (val: string) => any>> = {
    name: (val) => val,
    weight: (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {throw new Error("Invalid weight string wasn't caught by a constraint.")}
        return num
    },
    sort_order: (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {throw new Error("Invalid sort_order string wasn't caught by a constraint.")}
        return num
    },
    stock: (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {throw new Error("Invalid stock string wasn't caught by a constraint.")}
        return num
    },
    category_id: (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {throw new Error("Invalid category_id string wasn't caught by a constraint.")}
        return num
    },
    price: (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {throw new Error("Invalid price string wasn't caught by a constraint.")}
        return num;
    },
    customs_description: (val) => val,
    active: (val) => {
        val = val.toLowerCase()
        if (val === "true") return true;
        if (val === "false") return false;
        throw new Error("Invalid boolean wasn't caught by constraint.");
    },
    origin_country_code: (val) => val,
    description: (val) => val
}