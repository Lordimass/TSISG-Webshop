import "./product.css"
import {SquareImageBox} from '../squareImageBox/squareImageBox';
import Price from "../price/price.tsx";
import DineroFactory, {Currency} from "dinero.js";
import {getImageURL, getRepresentativeImageURL} from "@shared/functions/images.ts";
import {getProductPagePath} from "../../lib/paths.ts";
import {ProductData, OrderProdCompressed} from "@shared/types/supabaseTypes.ts";
import {ProductInBasket} from "@shared/types/types.ts";
import BasketModifier from "../ticker/basketModifier/basketModifier.tsx";
import {ProductPrice} from "../price/productPrice/productPrice.tsx";

/**
 * Displays a product or product group with a basket ticker.
 */
export default function Product({prod}: {
    /** The product or product group to display. */
    prod: ProductData | ProductData[]
})
{
    // Check whether product is a group or single product, and extract a representative product needed for some things.
    let representativeProduct: ProductData
    // prod is a group.
    if (Array.isArray(prod) && prod.length > 1) {
        prod = prod as ProductData[];
        representativeProduct = prod[0];
    }
    // prod is a group with a single element, or not a group
    else {
        // prod is a group with a single element
        if (Array.isArray(prod)) prod = prod[0];
        representativeProduct = prod;
    }

    const prodPagePath = getProductPagePath(representativeProduct.sku)
    const reprImageUrl = getRepresentativeImageURL(prod)

    return (
        <div className="product" id={"product-" + representativeProduct.sku}>
            {/* Product Image + Link to dedicated product page*/}
            <a className="product-image-link" href={prodPagePath}>
                <SquareImageBox image={reprImageUrl} size='100%'/>
            </a>

            {/* Bottom half of the product display */}
            <div className="prod-footer">
                <div className="product-text">
                    {/* Product Name + Link to dedicated product page */}
                    <a className="product-name" href={prodPagePath}>
                        {representativeProduct.name}
                    </a>
                    <ProductPrice prod={prod}/>
                </div>
                <div className='spacer'/>
                <div className='basket-modifier'>
                    <BasketModifier product={prod} inputId={`${representativeProduct.sku}-product-basket-modifier`}/>
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
export function BasketProduct({prod}: {
    /** The product in the customer's basket to display */
    prod: ProductInBasket
}
) {
    const imageURL = getRepresentativeImageURL(prod)
    const prodPagePath = getProductPagePath(prod.sku)

    return (
        <div className="basket-product" id={"product-" + prod.sku}>
            <a className="basket-prod-header" href={prodPagePath}>
                <SquareImageBox image={imageURL} size='100%' loading='eager'/>
            </a>

            <div className="basket-prod-footer">
                <div className="basket-product-text">
                    <a className="product-name" href={prodPagePath}>{prod.name}</a>
                    <ProductPrice prod={prod}/>
                </div>

                <BasketModifier inputId={`${prod.sku}-basket-basket-modifier`} product={prod} />
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
    if (!product) return null;

    const name = "name" in product ? product.name : product.product_name
    const quantity = "basketQuantity" in product
        ? product.basketQuantity
        : "quantity" in product
            ? product.quantity
            : undefined

    let image = product && "images" in product
        ? getRepresentativeImageURL(product) : undefined;

    let href = linked
        ? getProductPagePath(product.sku)
        : undefined;

    return (<a className="checkout-product" href={href}>
        <SquareImageBox image={image} size='100%' loading='eager'/>
        <div className="checkout-product-text">
            {quantity ? <p className='checkout-product-name'>{name} (x{quantity})</p> :
                <p className='checkout-product-name'>{name}</p>}
            <ProductPrice prod={product} currency={currency}/>
            {admin ? <p>SKU: {product.sku}</p> : <></>}
        </div>
        {checkbox ? <>
            <div className='product-filler'/>
            <input type='checkbox' className='product-checkbox'/></> : <></>}
    </a>)
}