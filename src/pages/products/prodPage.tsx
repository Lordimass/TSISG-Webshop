import {useContext, useEffect, useRef, useState} from "react"
import {blank_product, max_product_order} from "../../lib/consts.ts"
import "./prodPage.css"
import Markdown from "react-markdown"
import {LoginContext, SiteSettingsContext} from "../../app"
import {ProductData, ProductInBasket} from "@shared/types/types"
import ProductEditor from "./productEditor/productEditor"
import {UnsubmittedProductData} from "./productEditor/types.ts"
import {getBasketProducts, getGroup, setBasketStringQuantity} from "../../lib/lib"
import {cleanseUnsubmittedProduct, extractSKU, ProductContext} from "./lib"
import {useGetProducts} from "../../lib/supabaseRPC"
import {compareImages} from "../../lib/sortMethods"
import {SquareImageBox} from "../../components/squareImageBox/squareImageBox"
import {NotificationsContext} from "../../components/notification/lib"
import Page404 from "../404/404"
import {triggerViewItem, triggerViewItemList} from "../../lib/analytics/analytics"
import Page from "../../components/page/page"
import DineroFactory from "dinero.js";
import Price from "../../components/price/price.tsx";
import {LocaleContext} from "../../localeHandler.ts";
import {getPath} from "../../lib/paths.ts";
import {ProductGroup} from "./productGroup.tsx";

/** Dedicated page for a product, including an editor for admins. */
export default function ProdPage(
    {sku}: {
        /** SKU on Supabase of the product to display. If undefined, will pull the SKU from the URL. */
        sku?: number
    }
) {
    const loginContext = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)
    const {currency} = useContext(LocaleContext)

    // Extract SKU from URL if not provided.
    sku = sku ?? extractSKU();
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
    if (resp.error) {
        notify(resp.error.message)
    }
    const prod = resp.data?.[0]
    useEffect(() => {
        if (!resp.loading && prod) {
            // Set the product state
            setProduct(prod)
            if (!originalProdSet.current) {
                setOriginalProd(structuredClone(prod))
                originalProdSet.current = true;
            }
            triggerViewItem(prod, currency)
        } else if (!resp.loading && !prod) {
            return404.current = true;
        }
    }, [resp.loading])

    useEffect(() => {
        if (product.sku === 0) return
        // Fetch any products in group
        getGroup(product.group_name).then(
            async (g) => {
                setGroup(g);
                if (g.length > 0) await triggerViewItemList(
                    g,
                    `product-group-page`,
                    `Product Group Page`,
                    currency
                )
            },
            (error) => {
                setGroup([]);
                console.error(error)
            }
        )
    }, [product])

    // Set isEditMode based on loginContext permissions
    useEffect(() => setIsEditMode(loginContext.permissions.includes("edit_products")), [loginContext])

    // TODO: Implement this so that it displays the first image of the hovered product in place of the carousel if set.
    const [hoveredVariant, setHoveredVariant] = useState<UnsubmittedProductData | undefined>(undefined);

    // Prices in the database are in Decimal Pounds (GBP), create a Dinero object holding that data to allow us
    // to convert it to the users locale later.
    const priceUnits = Math.round(product.price * 100)
    const dinero = DineroFactory({amount: priceUnits, currency: "GBP", precision: 2})

    if (return404.current) return <Page404/>
    return (<Page
        title={`TSISG - ${product.group_name ?? product.name}`}
        metaDescription={product.description}
        canonical={`https://thisshopissogay.com/products/${sku}`}
    >

        <ProductContext.Provider value={{
            basketQuant,
            setBasketQuant,
            product,
            setProduct,
            originalProd,
            group,
            hoveredVariant,
            setHoveredVariant
        }}>

            {/* Above actual product */}
            <a className="go-home-button" href={getPath("HOME")}>
                <i className="fi fi-sr-left"/>
                <h1>Go Home</h1>
            </a>
            {isEditMode ?
                <p className="logged-in-disclaimer">
                    You see additional information on this page because you
                    are <a href={getPath("LOGIN")}>logged into</a> an account with special
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
                                    variant => {
                                        return variant.images?.filter(img =>
                                            img.product_sku !== product.sku &&
                                            img.association_metadata?.global
                                        ) ?? []
                                    }
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
                            ? <><br/>
                                <div className="sku">SKU{sku}</div>
                            </>
                            : <><br/>
                                <div
                                    className="sku">SKUS{group.map(prod => prod.sku).sort().map(sku => " " + sku).toString()}</div>
                            </>
                        : <></>}
                </h1>
                <div className="price-container">
                    <Price baseDinero={dinero}/>
                </div>


                <div className="tags">{product.tags.map((tag: any) => (
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

        </ProductContext.Provider></Page>)
}

function QuantityTicker() {
    const {currency} = useContext(LocaleContext)

    async function increment() {
        if (basketQuant == undefined) {
            return
        }
        await updateQuantity(basketQuant + 1)
    }

    async function decrement() {
        if (basketQuant == undefined) {
            return
        }
        await updateQuantity(basketQuant - 1)
    }

    async function updateQuantity(newQuantity?: number) {
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
        setBasketStringQuantity(
            cleanseUnsubmittedProduct(product), newQuantity, currency
        )
        setBasketQuant(newQuantity)
    }

    /**
     * Resets the value in the HTMLInput to the value from the basket.
     * Run when the quantity of this product updates from some other source, like the basket.
     */
    function syncWithBasket() {
        if (basketQuant == null || !setBasketQuant || product.sku === 0) return
        const basket = getBasketProducts()
        const item: ProductInBasket | undefined = basket.find(item => item.sku === product.sku);
        // If it doesn't find the product, it must not be in the basket anymore, so set the quant to 0
        if (!item) {
            setBasketQuant(0);
            return;
        }

        // Set the basket quantity state for the product
        setBasketQuant(item.basketQuantity);

        // Update product input to be correct
        setInputValue(item.basketQuantity)

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
            || !product.active
            || (siteSettings.kill_switch?.enabled ?? false)
        setDisabled(disabled)
        // If the product is disabled, ensure the basket quantity is 0
        if (disabled && product.sku != 0) {
            console.log("Product disabled, setting basket quantity to 0")
            setBasketStringQuantity(cleanseUnsubmittedProduct(product), 0, currency)
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
                onClick={() => updateQuantity(1)}
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
                onBlur={async () => {
                    await updateQuantity()
                }}
                defaultValue={basketQuant}
            />
            <div className='increment-basket-quantity-button' onClick={increment}>
                <h1>+</h1>
            </div>
        </div>)
    }
}