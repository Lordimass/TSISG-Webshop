import Ticker from "../ticker.tsx";
import {ArgumentsType} from "@vitest/utils";
import {useContext, useEffect, useRef, useState} from "react";
import "./basketModifier.css"
import {UnsubmittedProductData} from "../../../pages/products/productEditor/types.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {MAX_PRODUCT_ORDER} from "../../../lib/consts.ts";
import {useGetDisabledStatus} from "./lib.tsx";
import {getBasketProducts, setBasketStringQuantity} from "../../../lib/lib.tsx";
import {cleanseUnsubmittedProduct} from "../../../pages/products/lib.tsx";
import {LocaleContext} from "../../../localeHandler.ts";

export default function BasketModifier(
    {product, ...args}: ArgumentsType<typeof Ticker>[0] & {
        /** The product for which to control the basket quantity of */
        product: ProductData | UnsubmittedProductData
    }
) {
    /**
     * Callback function to run when the value of the ticker changes.
     *
     * @param val The new value of the ticker
     */
    async function onTickerChange(val: number) {
        setBasketQuantity(val)
        setBasketStringQuantity(cleanseUnsubmittedProduct(product), val, currency)
        if (args.onChange) await args.onChange(val)
    }

    /**
     * Sync the value of the ticker with the current quantity in the basket string. Runs when the quantity of this
     * product updates from some other source, like the basket editor in the site header.
     */
    async function syncWithBasket() {
        // Find the product in the basket
        const basket = getBasketProducts()
        const item = basket.find(item => item.sku === product.sku)
        const newQuantity = item?.basketQuantity ?? 0
        if (newQuantity !== basketQuantity) {
            console.log(`${args.inputId} updated to ${newQuantity} from ${basketQuantity}`)
            setBasketQuantity(newQuantity)
            await updateTickerRef.current!(newQuantity)
        }
    }

    // Get currency for updating the basket string
    const {currency} = useContext(LocaleContext)
    // The value of the ticker. In theory, this is always in sync with the basket through `syncWithBasket`
    const [basketQuantity, setBasketQuantity] = useState<number>(0)
    // The maximum value of the ticker
    const max = Math.min(MAX_PRODUCT_ORDER, product.stock)
    // The disabled status of this ticker, as well as an explanatory message if it is disabled.
    const disabled = useGetDisabledStatus(product)
    // A ref to a method that can be called to update the ticker value.
    const updateTickerRef = useRef<(newValue: number) => Promise<void>>(null)

    // TODO: Handle strange bug with other tickers on page not updating properly on 1 and 2 sometimes?
    // TODO: Get disabled tickers to set basket quantity to 0. But keep in mind that this will screw with storybook. Maybe have different products for each story?

    useEffect(() => {
        syncWithBasket().then()
        window.addEventListener("basketUpdate", syncWithBasket)
        return () => window.removeEventListener("basketUpdate", syncWithBasket)
    }, [])

    if (basketQuantity === 0) {
        return <ZeroQuantityBasketModifier
            disabled={disabled}
            onTickerChange={onTickerChange}
        />
    } else {
        return <Ticker
            {...args}
            defaultValue={basketQuantity}
            onChange={onTickerChange}
            max={max}
            updateValueRef={updateTickerRef}
        />
    }
}

function ZeroQuantityBasketModifier(
    {disabled, onTickerChange}: {
        /** Whether the basket modifier should be disabled, and an optional message to explain why it's disabled */
        disabled?: {isDisabled: boolean, message?: string}
        /** Function to call when the ticker value changes, used when this component changes quantity from 0 to 1 */
        onTickerChange: (val: number) => void
    }
) {
    const isDisabled = disabled?.isDisabled

    return (<div className="zero-quantity-basket-modifier">
        {isDisabled && disabled.message ? <p>{disabled.message}</p> : null}
        <button
            onClick={() => onTickerChange(1)}
            disabled={isDisabled}
        >
            <i className="fi fi-sr-shopping-basket basket-icon"/>+
        </button>
    </div>)
}

