import Ticker from "../ticker.tsx";
import {ArgumentsType} from "@vitest/utils";
import {useContext, useEffect, useRef, useState} from "react";
import "./basketModifier.css"
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {MAX_PRODUCT_ORDER} from "../../../lib/consts.ts";
import {useGetDisabledStatus} from "./lib.tsx";
import {getBasketProducts, setBasketStringQuantity} from "../../../lib/lib.tsx";
import {cleanseUnsubmittedProduct} from "../../../pages/products/lib.tsx";
import {LocaleContext} from "../../../localeHandler.ts";
import {getProductPagePath} from "../../../lib/paths.ts";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";

export default function BasketModifier(
    {product, ...args}: Omit<ArgumentsType<typeof Ticker>[0], "ariaLabel"> & {
        /** The product for which to control the basket quantity of */
        product: ProductData | UnsubmittedProductData | ProductData[] | UnsubmittedProductData[]
    }
) {
    /**
     * Callback function to run when the value of the ticker changes.
     *
     * @param val The new value of the ticker
     */
    async function onTickerChange(val: number) {
        setBasketQuantity(val)
        setBasketStringQuantity(cleanProduct, val, currency)
        if (args.onChange) await args.onChange(val)
    }

    /**
     * Sync the value of the ticker with the current quantity in the basket string. Runs when the quantity of this
     * product updates from some other source, like the basket editor in the site header.
     */
    async function syncWithBasket() {
        // Find the new quantity of the product in the basket
        const basket = getBasketProducts()
        const item = basket.find(item => item.sku === reprProd.sku)
        const newQuantity = item?.basketQuantity ?? 0

        // Update state and ticker value if it exists.
        setBasketQuantity(newQuantity)
        if (updateTickerRef.current) {
            await updateTickerRef.current(newQuantity)
        }
    }

    // Check if product is a group and return a different component if so
    let altReturnComponent
    let reprProd: ProductData | UnsubmittedProductData
    if (Array.isArray(product) && product.length > 1) {
        // Cannot return straight away because of hooks.
        altReturnComponent = <ProductGroupBasketModifier products={product} height={args.height}/>
        reprProd = product[0]
    }
    else if (Array.isArray(product)) reprProd = product[0]
    else reprProd = product

    // Get currency for updating the basket string
    const {currency} = useContext(LocaleContext)
    // The value of the ticker. In theory, this is always in sync with the basket through `syncWithBasket`
    const [basketQuantity, setBasketQuantity] = useState<number>(0)
    // The maximum value of the ticker
    const max = Math.min(MAX_PRODUCT_ORDER, reprProd.stock)
    // The disabled status of this ticker, as well as an explanatory message if it is disabled.
    const disabled = useGetDisabledStatus(reprProd)
    // A ref to a method that can be called to update the ticker value.
    const updateTickerRef = useRef<(newValue: number) => Promise<void>>(null)
    // A clean product to avoid having to reclean it every time it needs to be used in a clean situation
    const cleanProduct = cleanseUnsubmittedProduct(reprProd)

    // If the product is disabled, it cannot be in the cart
    useEffect(() => {
        if (disabled.isDisabled) {
            console.log("Product disabled")
            onTickerChange(0).then()
        }
    }, [disabled])

    useEffect(() => {
        if (!disabled.isDisabled) { // Adding listener is pointless if the product is disabled.
            syncWithBasket().then()
            window.addEventListener("basketUpdate", syncWithBasket)
            return () => {window.removeEventListener("basketUpdate", syncWithBasket)}
        }
    }, [product])

    if (altReturnComponent) return altReturnComponent;
    else if (basketQuantity === 0) {
        return <ZeroQuantityBasketModifier
            disabled={disabled}
            onTickerChange={onTickerChange}
            height={args.height}
        />
    } else {
        return <Ticker
            {...args}
            ariaLabel={"Basket quantity"}
            defaultValue={basketQuantity}
            onChange={onTickerChange}
            max={max}
            min={0}
            updateValueRef={updateTickerRef}
        />
    }
}

function ProductGroupBasketModifier({products, height = "50px"}: {
    /** The products that this basket modifier represents */
    products: (ProductData | UnsubmittedProductData)[]
    /** The height of the element */
    height?: string
}) {
    // If there are no products in the group, button is disabled.
    const disabled = products.length == 0
    // The first product is the representative for the group.
    const representative = disabled ? undefined : products[0]

    return (
        <a
            className="product-group-basket-modifier"
            href={representative ? getProductPagePath(representative.sku) : undefined}
            aria-disabled={disabled}
            style={{height}}
        >
            <p>View Options <i className="fi fi-rr-angle-right"></i></p>
        </a>
    )
}

function ZeroQuantityBasketModifier(
    {disabled, onTickerChange, height = "50px"}: {
        /** Whether the basket modifier should be disabled, and an optional message to explain why it's disabled */
        disabled?: {isDisabled: boolean, message?: string}
        /** Function to call when the ticker value changes, used when this component changes quantity from 0 to 1 */
        onTickerChange: (val: number) => void
        /** Height of the element */
        height?: string
    }
) {
    const isDisabled = disabled?.isDisabled

    return (<div className="zero-quantity-basket-modifier" style={{height}}>
        {isDisabled && disabled.message ? <p>{disabled.message}</p> : null}
        <button
            onClick={() => onTickerChange(1)}
            disabled={isDisabled}
        >
            <i className="fi fi-sr-shopping-basket basket-icon"/>+
        </button>
    </div>)
}

