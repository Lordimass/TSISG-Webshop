import {useState, useEffect, useContext} from 'react';

import "./product.css"
import {blank_product, MAX_PRODUCT_ORDER} from '../../lib/consts.ts';
import {SquareImageBox} from '../squareImageBox/squareImageBox';
import {getBasket, getBasketProducts, setBasketStringQuantity} from '../../lib/lib';
import {ProductContext} from '../../pages/products/lib';
import Price from "../price/price.tsx";
import DineroFactory, {Currency} from "dinero.js";
import {LocaleContext} from "../../localeHandler.ts";
import {getImageURL, getRepresentativeImageURL} from "@shared/functions/images.ts";
import {getProductPagePath} from "../../lib/paths.ts";
import {CategoryData, ProductData, ImageData, OrderProduct, OrderProdCompressed} from "@shared/types/supabaseTypes.ts";
import {ProductInBasket} from "@shared/types/types.ts";
import BasketModifier, {ProductGroupBasketModifier} from "../ticker/basketModifier/basketModifier.tsx";

/**
 * Displays a product or product group with a basket ticker.
 */
export default function Product({prod}: {
    /** The product or product group to display. */
    prod: ProductData | ProductData[]
})
{
    const {currency} = useContext(LocaleContext);

    // Redefining variables after changing parameter to accept
    // full product instead of just select information. Done to
    // avoid refactoring the whole component to use product.???
    let sku: number, name: string, price: number
    let group = false
    let product: ProductData[] | ProductData
    if ("length" in prod && prod.length === 1) product = prod[0]
    else product = prod

    if (!("length" in product)) { // Product is not in a group
        sku = product.sku
        name = product.name
        price = product.price
    } else { // Product is in a group
        product = product as unknown as ProductData[]
        sku = product[0].sku
        name = product[0].group_name!
        price = product[0].price
        group = true
    }
    const singleProd = !group ? product as ProductData : undefined
    const imageURL = getRepresentativeImageURL(product)

    // Prices in the database are in Decimal Pounds (GBP), create a Dinero object holding that data to allow us
    // to convert it to the users locale later.
    const priceUnits = Math.round(price*100)
    const dinero = DineroFactory({amount: priceUnits, currency: "GBP", precision: 2})

    return (
        <div className="product" id={"product-" + sku}>
            {/* Product Image + Link to dedicated product page*/}
            <a className="product-image-link" href={getProductPagePath(sku)}>
                <SquareImageBox image={imageURL} size='100%'/>
            </a>

            {/* Bottom half of the product display */}
            <div className="prod-footer">
                <div className="product-text">
                    {/* Product Name + Link to dedicated product page */}
                    <a className="product-name" href={getProductPagePath(sku)}>
                        {name}
                    </a>
                    <Price baseDinero={dinero}/>
                </div>
                <div className='spacer'/>
                <div className='basket-modifier'>
                    {!group
                        ? <BasketModifier product={singleProd!} inputId={`${singleProd!.sku}-product-basket-modifier`} height={"100%"}/>
                        : <ProductGroupBasketModifier products={product as ProductData[]} height={"100%"}/>
                    }
                </div>
            </div>
        </div>
    )
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Displays a product from the customer's basket with a basket ticker. Visually, this component is more suited to be
 * shown in the basket than the default {@link Product} component.
 */
export function BasketProduct({product}: {
    /** The product in the customer's basket to display */
    product: ProductInBasket
}
) {
    const {sku, name, price, images, stock} = product

    const imageURL = getImageURL(images[0])
    const link = getProductPagePath(sku)

    // Prices in the database are in Decimal Pounds (GBP), create a Dinero object holding that data to allow us
    // to convert it to the users locale later.
    const priceUnits = Math.round(price*100)
    const dinero = DineroFactory({amount: priceUnits, currency: "GBP", precision: 2})

    return (
        <div className="basket-product" id={"product-" + sku}>
            <a className="basket-prod-header" href={link}>
                <SquareImageBox image={imageURL} size='100%' loading='eager'/>
            </a>

            <div className="basket-prod-footer">
                <div className="basket-product-text">
                    <a className="product-name" href={link}>{name}</a>
                    <Price baseDinero={dinero}/>
                </div>

                <BasketModifier inputId={`${product.sku}-basket-basket-modifier`} product={product} />
            </div>
        </div>
    )
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Display a product without a basket ticker. Primarily used for recapping the customer basket on the checkout page.
 */
export function CheckoutProduct({
    product,
    admin = false,
    checkbox = false,
    linked = false,
    currency
} : {
    /** The product to display */
    product: ProductData | ProductInBasket | OrderProdCompressed
    /** Whether the product should be rendered in admin mode or not */
    admin?: boolean
    /** Whether to display a checkbox alongside the product, for ticking off lists etc. */
    checkbox?: boolean
    /** Whether the product should be clickable to go to its product page */
    linked?: boolean
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency
}
) {
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
        ? getProductPagePath(sku)
        : undefined;

    if (image == "") image = undefined

    // Prices in the database are in Decimal Pounds (GBP), create a Dinero object holding that data to allow us
    // to convert it to the users locale later.
    const priceUnits = Math.round(total*100)
    const dinero = DineroFactory({amount: priceUnits, currency: "GBP", precision: 2})

    return (<a className="checkout-product" href={href}>
        <SquareImageBox image={image} size='100%' loading='eager'/>
        <div className="checkout-product-text">
            {quantity ? <p className='checkout-product-name'>{name} (x{quantity})</p> :
                <p className='checkout-product-name'>{name}</p>}
            <Price baseDinero={dinero} currency={currency} />
            {admin ? <p>SKU: {sku}</p> : <></>}
        </div>
        {checkbox ? <>
            <div className='product-filler'/>
            <input type='checkbox' className='product-checkbox'/></> : <></>}
    </a>)
}