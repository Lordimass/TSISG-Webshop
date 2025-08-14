import { createContext, ReactElement, useContext, useEffect, useRef, useState } from "react"
import Footer from "../../assets/components/footer"
import Header from "../../assets/components/header"
import { product } from "../../assets/components/products"
import SquareImageBox from "../../assets/components/squareImageBox"
import { back_icon, basket_icon, blank_product, max_product_order } from "../../assets/consts"
import { fetchFromNetlifyFunction, getJWTToken, setBasketStringQuantity, softParseJSON, updateProductData, useFetchFromNetlifyFunction, useGetProduct } from "../../assets/utils"
import "./prodPage.css"
import { productInBasket } from "../../assets/components/product"
import Markdown from "react-markdown"
import { LoginContext, NotificationsContext } from "../../app"
import { category_prod_prop, EditableProductProp, editableProductProps } from "./editableProductProps"
import { prodPropParsers } from "./prodPropParsers"

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
                <div className="tag" key={tag.name}>{tag.name}</div>
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
        const tagsResp = await fetchFromNetlifyFunction("getPropertyLists")
        if (!response.error && response.data && setProduct) {
            propLists = tagsResp.data
        }
    }

    const {product, setProduct, originalProd} = useContext(ProductContext)
    if (!product) {
        return
    }

    // Fetch prop lists
    let propLists: {
        tags: {id: number, name: string}[], 
        categories: {id: number, name: string}[]
    } | undefined = useFetchFromNetlifyFunction("getPropertyLists").data
    
    // Compile HTMLOptionElement's to use in datalist.
    let catOpts: ReactElement[] = []
    if (propLists && propLists.categories) {
        catOpts = propLists.categories.map((cat) => <option value={cat.name} key={cat.id}>{cat.name}</option>)
    } else {
        catOpts = []
    }

    const inputBox = useRef<HTMLInputElement>(null);

    return (<div className="product-editor">
        <div className="product-editor-grid">
            {/* All standard text field properties */}
            {editableProductProps.map((productProp) => 
            <EditableProductPropContext.Provider 
                value={{product, setProduct, productProp, originalProd}} 
                key={productProp.propName}
            >
                <EditableProdPropBox fetchNewData={fetchNewData}/>
            </EditableProductPropContext.Provider>)}
            
            {/* Category field editor */}
            <EditableProductPropContext.Provider value={{product, setProduct, productProp: category_prod_prop, originalProd}}>
                <EditableProdPropBox fetchNewData={fetchNewData} inputField={<>
                    <input list="category-options" id={category_prod_prop.propName+"-editor-input"} placeholder={product.category.name} ref={inputBox}/>
                    <datalist id="category-options" defaultValue={product.category.name}>{catOpts}</datalist>
                </>}/>
            </EditableProductPropContext.Provider>
        </div>
        <button className="refresh-product" onClick={fetchNewData}>Refresh Data</button>
    </div>)
}

function EditableProdPropBox({fetchNewData, inputField}: {fetchNewData: () => Promise<void>, inputField?: ReactElement}) {
    /**
     * Updates the given product live on screen and internally within Supabase.
     * @param key A keyof the product type as a string. The key of the value to change
     * @param value The new value to map the key to. Automatically parsed to the right type for the given key
     * @param constraint A boolean method which returns true if the value is valid, false if not.
     */
    async function updateProduct(key: keyof product, value: any, constraint: (value: string) => boolean) {
        async function assignTypedValue<K extends keyof product>( // Parse string to right type using mapped parser from productTypeMap
            key: K,
            val: string,
            target: Partial<product>
        ) {
            const parser = prodPropParsers[key];
            if (parser) {
                target[key] = await parser(val);
            } else { // Fallback to raw string if no parser provided
                target[key] = val as product[K]
            }
        }

        // When the inputField is specified, the value of `value` will be undefined since the ref cannot point to it.
        // In this case we have to find the input box from the context.
        if (!value) {
            const unvalidatedInputField = document.getElementById(category_prod_prop.propName + "-editor-input")
            if (unvalidatedInputField && unvalidatedInputField.tagName == "INPUT") {
                const inputField = unvalidatedInputField as HTMLInputElement
                value = inputField.value
                inputField.value = ""
                inputField.placeholder = value
            }
        }

        const valid = constraint(value)
        if (!valid) {
            notify(`Value for ${key} is invalid.`)
            return
        }
        if (!setProduct) {return}

        const newProduct: product = {...product}
        // Assign the changed value
        await assignTypedValue(key, value, newProduct)
        // Update on Supabase
        await updateProductData(newProduct)
        // Fetch new data to update anything else that changed (last_edited, last_edited_by, etc.)
        fetchNewData()
    }

    const loginContext = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)

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
            {inputField ? inputField : 
            <textarea 
                className="prop-editor-input"
                id={productProp.propName.toString()+"-editor-input"}
                defaultValue={product[productProp.propName] == null ? product[productProp.propName]?.toString() : "Error: Invalid Key Value"}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                ref={(el) => {autoResizeTextarea(el); inputBox.current = el}}
                disabled={!editable}
            />}
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