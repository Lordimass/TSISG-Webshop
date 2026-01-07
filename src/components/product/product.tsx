import "./product.css"
import {SquareImageBox} from '../squareImageBox/squareImageBox';
import {Currency} from "dinero.js";
import {getRepresentativeImageURL} from "@shared/functions/images.ts";
import {getProductPagePath} from "../../lib/paths.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import BasketModifier from "../ticker/basketModifier/basketModifier.tsx";
import {ProductPrice} from "../price/productPrice/productPrice.tsx";
import {
    GenericProduct,
    GenericSingleProduct,
    OrderProdCompressed,
    ProductInBasket
} from "@shared/types/productTypes.ts";

/** Displays a product or product group with a basket ticker. */
export default function Product({prod, horizontal=false}: {
    /** The product or product group to display. */
    prod: GenericProduct;
    /** Whether the product should order content horizontally rather than vertically. Defaults to `false`. */
    horizontal?: boolean
})
{
    // Check whether product is a group or single product, and extract a representative product needed for some things.
    let representativeProduct: GenericProduct
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

    /** Relative link to the dedicated product page. */
    const prodPagePath = getProductPagePath(representativeProduct.sku)

    return (
        <div className={"product"+(horizontal?" horizontal-product":"")}>
            <HyperlinkedProductImage href={prodPagePath} prod={representativeProduct} />

            {/* Bottom half of the product display */}
            <div className="prod-footer">
                <div className="product-text">
                    {/* Product Name + Link to dedicated product page */}
                    <a className="product-name" href={prodPagePath}>
                        {representativeProduct.name}
                    </a>
                    <ProductPrice prod={prod}/>
                </div>
                <div className='basket-modifier-container'>
                    <BasketModifier
                        product={prod}
                        inputId={`${representativeProduct.sku}-product-component-basket-modifier`}
                    />
                </div>
            </div>
        </div>
    )
}

/** Product Image + Link to dedicated product page **/
function HyperlinkedProductImage({href, prod}: {href: string, prod: GenericSingleProduct}) {
    const reprImageUrl = getRepresentativeImageURL(prod)
        return (
            <a className="product-image-link" href={href}>
                <SquareImageBox image={reprImageUrl} size='100%'/>
            </a>
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
            {quantity ? <p className='checkout-product-name'>{product.name} (x{quantity})</p> :
                <p className='checkout-product-name'>{product.name}</p>}
            <ProductPrice prod={product} currency={currency}/>
            {admin ? <p>SKU: {product.sku}</p> : <></>}
        </div>
        {checkbox ? <>
            <div className='product-filler'/>
            <input type='checkbox' className='product-checkbox'/></> : <></>}
    </a>)
}