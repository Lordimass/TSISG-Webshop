import { useContext, useEffect, useRef, useState } from "react"
import Footer from "../../components/header-footer/footer"
import Header from "../../components/header-footer/header"
import { blank_product, max_product_order } from "../../lib/consts"
import "./prodPage.css"
import Markdown from "react-markdown"
import { LoginContext, SiteSettingsContext } from "../../app"
import { ImageData, ProductData, ProductInBasket } from "../../lib/types"
import ProductEditor from "./productEditor/productEditor"
import { UnsubmittedImageData, UnsubmittedProductData } from "./productEditor/types"
import { getGroup, getImageURL, setBasketStringQuantity } from "../../lib/lib"
import { cleanseUnsubmittedProduct, extractSKU, ProductContext } from "./lib"
import { useGetProducts } from "../../lib/supabaseRPC"
import { compareImages } from "../../lib/sortMethods"
import SquareImageBox from "../../components/squareImageBox/squareImageBox"
import { NotificationsContext } from "../../components/notification/lib"
import Page404 from "../404/404"
import { triggerViewItem } from "../../lib/analytics/analytics"

export default function ProdPage() {
    const loginContext = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)

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
    // Products in a group with this one    
    const [group, setGroup] = useState<ProductData[]>([])
    // Used to set hovered image width to be the same as the carousel
    const carouselContainerRef = useRef<HTMLDivElement>(null)
    const return404 = useRef(false)

    // Whether the user is logged in with edit permissions
    const [isEditMode, setIsEditMode] = useState(false)
    // Fetch product data from backend, then assign it to product state and originalProd if not already set
    const resp = useGetProducts([sku], false); 
    if (resp.error) {notify(resp.error.message)}
    const prod = resp.data?.[0]
    useEffect(() => {
        if (!resp.loading && prod) {
            // Set the product state
            setProduct(prod)
            if (!originalProdSet.current) {
                setOriginalProd(structuredClone(prod))
                originalProdSet.current = true;
            }
            triggerViewItem(prod)
        } else if (!resp.loading && !prod) {
            return404.current = true;
        }
    }, [resp.loading])

    useEffect(() => {
        if (product.sku === 0) return
        // Fetch any products in group
        getGroup(product.group_name).then(
            setGroup, 
            (error) => {setGroup([]); console.error(error)}
        )
    }, [product])

    // Set isEditMode based on loginContext permissions
    useEffect(() => setIsEditMode(loginContext.permissions.includes("edit_products")), [loginContext])

    // TODO: Implement this so that it displays the first image
    // of the hovered product in place of the carousel if set.
    // Also display the name of the variant.
    const [hoveredVariant, setHoveredVariant] = useState<UnsubmittedProductData | undefined>(undefined);

    const priceSplit = product.price.toString().split(".")
    const priceMajor = priceSplit[0]
    let priceMinorString = priceSplit[1]
    if (!priceMinorString) {
        priceMinorString = "0"
    }
    const priceMinor = priceMinorString.padEnd(2, "0")

    const page_title = `TSISG - ${product.group_name ?? product.name}`

    if (return404.current) return <Page404/>
    return (<><Header/><div className="content prodPage"><ProductContext.Provider value={{
            basketQuant, 
            setBasketQuant, 
            product, 
            setProduct, 
            originalProd, 
            group,
            hoveredVariant,
            setHoveredVariant
        }}>

        <title>{page_title}</title>
        <meta name="description" content={product.description}/>
        <link rel='canonical' href={`https://thisshopissogay.com/products/${sku}`}/>
        
        {/* Above actual product */}
        <a className="go-home-button" href="/">
            <i className="fi fi-sr-left"/>
            <h1>Go Home</h1>
        </a>
        {isEditMode ? 
        <p className="logged-in-disclaimer">
            You see additional information on this page because you
            are <a href="/login">logged into</a> an account with special
            access.
        </p> : <></>}

        {/* Actual box containing this product's information */}
        <div className="product-box">
            <div className="image" ref={carouselContainerRef}>{hoveredVariant
                ? <div className="hover-product-image">
                <SquareImageBox
                    image={cleanseUnsubmittedProduct(hoveredVariant).images[0]}
                    size={(carouselContainerRef.current?.offsetWidth ?? 0) + "px"}
                    loading="eager"
                 /></div> : <></>}
                 <SquareImageBox 
                    images={
                        // Images from this product
                        [...cleanseUnsubmittedProduct(product)
                            .images
                            // Filter out the group_product_icon if there is one
                            .filter(img => 
                                !img.association_metadata?.group_product_icon &&
                                !img.association_metadata?.group_representative
                            ),
                        // Global images from products in group
                        ...group.map(
                            variant => {return variant.images?.filter(img => 
                                img.product_sku !== product.sku && 
                                img.association_metadata?.global
                            ) ?? []}
                        ).flat(1)
                        ].sort(compareImages)
                    } 
                    size="100%" 
                    loading="eager"
                />
            </div>
            <h1 className="title">
                {product.group_name ?? product.name}
                {isEditMode 
                ? group.length === 0 
                    ? <><br/><div className="sku">SKU{sku}</div></> 
                    : <><br/><div className="sku">SKUS{group.map(prod=>prod.sku).sort().map(sku => " "+sku).toString()}</div></>
                : <></>}
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
            <div className="ticker">
                <ProductGroup/>
                <QuantityTicker/>
            </div>
        </div>

        {isEditMode ? <ProductEditor/> : <></>}
    </ProductContext.Provider></div><Footer/></>)
}

function ProductGroup() {
    const {product, group, hoveredVariant, setHoveredVariant} = useContext(ProductContext)
    const groupRef = useRef<HTMLDivElement>(null)
    /**
     * The name of the current hovered variant, or the selected product if none is hovered.
     * Prioritises the variant_name first, then the full product name if that doesn't exist.
     */
    const name = 
    hoveredVariant?.metadata.variant_name ??
    hoveredVariant?.name ??
    product.metadata.variant_name ??
    product.name
    if (!setHoveredVariant) return <></>

    // Only change back to normal after mouse leaves this box
    useEffect(() => {
        if (!groupRef.current) return
        groupRef.current.addEventListener("mouseleave", () => setHoveredVariant(undefined))
        return () => groupRef.current?.removeEventListener("mouseleave", () => setHoveredVariant(undefined))
    }, [groupRef.current])

    if (group.length === 0) {return <></>}
    return (<>
        <p className="p-small">Variant: {name}</p>
        <div className="product-group" ref={groupRef}>
        {group.map(p => <ProductVariant product={p} key={p.sku} />)}
    </div></>)
}

function ProductVariant({
    product, 
} : {
    product: UnsubmittedProductData
}) {
    function changeProduct() {
        if (!setProduct) return
        setProduct(product)
        window.history.pushState(undefined, product.name, `/products/${product.sku}`)
        triggerViewItem(cleanseUnsubmittedProduct(product))
    }
    /** 
     * The image to display for the product, either the group_product_icon
     * if it exists, or just the first image of the product if not.
     */
    const image: ImageData | UnsubmittedImageData | undefined = 
    product.images?.filter(img => 
        img.association_metadata.group_product_icon
    )[0] ?? product.images?.[0]
    // TODO: Rename group_product_icon to variant_icon, it makes more sense
    // TODO: Have variant icons stored in their own bucket which contains significantly
    // smaller icons (they only need to be 100px max anyways)

    const {product: mainProduct, setProduct, hoveredVariant, setHoveredVariant} = useContext(ProductContext)
    if (!setHoveredVariant) return <></>

    // Since SquareImageBox doesn't take UnsubmittedImageData, we'll
    // extract the image_url and alt here instead.
    let image_url: string | undefined
    let alt: string | undefined
    if (image) {
        image_url = "id" in image
            ? getImageURL(image)
            : image.local_url
        alt = image.alt ?? undefined
    }

    return (<button 
        className={"product-variant" + (product.sku === mainProduct.sku ? " selected-product-variant" : "")} 
        onMouseEnter={() => setHoveredVariant(product)}
        onClick={changeProduct}
    >
    <SquareImageBox 
        image={image_url} 
        alt={alt} 
        size="100px"
    />
    <p className="p-small">£{product.price.toFixed(2)}</p>
    
    </button>);
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
        setInputValue(newQuantity)
        setBasketStringQuantity(cleanseUnsubmittedProduct(product), newQuantity)
        setBasketQuant(newQuantity)
    }

    /**
     * Resets the value in the HTMLInput to the value from the basket.
     * Run when the quantity of this product updates from some other source, like the basket.
     */
    function syncWithBasket() {
        if (basketQuant == null || !setBasketQuant || product.sku === 0) return

        let basketString: string | null = localStorage.getItem("basket");
        if (basketString) {
            let basket: Array<ProductInBasket> = JSON.parse(basketString).basket;
            let item: ProductInBasket | undefined = basket.find(item => item.sku === product.sku);
            // If don't find the product, it must not be in the basket anymore, so set the quant to 0
            if (!item) {setBasketQuant(0); return;}

            // Set the basket quantity state for the product
            setBasketQuant(item.basketQuantity);
            
            // Update product input to be correct
            setInputValue(item.basketQuantity)
        }
    }

    function setInputValue(value: number) {
        if (inputField.current) {
            inputField.current.value = value.toString()
        }
    }

    const inputField = useRef<HTMLInputElement>(null)
    const {basketQuant, setBasketQuant, product} = useContext(ProductContext)
    const max_order = Math.min(max_product_order, product.stock)
    const [disabled, setDisabled] = useState(true)
    useEffect(() => {
        const disabled = product.stock <= 0 
            || product.active === false 
            || (siteSettings.kill_switch?.enabled ?? false)
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
    
    useEffect(() => {
        syncWithBasket()
        window.addEventListener("basketUpdate", syncWithBasket)
        return () => window.removeEventListener("basketUpdate", syncWithBasket)
    }, [product])
    
    if (basketQuant == 0) { // Quant0Modifier
        return (<div>
        <p>{disabledMessage}</p>
        <button 
            className="basket-button prod-page-basket-button" 
            onClick={()=>updateQuantity(1)}
            disabled={disabled}
        >
            <h1><i className="fi fi-sr-shopping-basket basket-icon"/>+</h1>
        </button>
        </div>)
    } else { // Standard Basket Modifier
        return (<div className='basket-modifier prod-page-modifier'>
        <div className='decrement-basket-quantity-button' onClick={decrement}>
            <h1>-</h1>
        </div>
        <input 
            id={'basket-input-' + product.sku} 
            ref={inputField}
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