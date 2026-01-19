import "./product.css"
import {SquareImageBox} from '../squareImageBox/squareImageBox';
import {Currency} from "dinero.js";
import {getRepresentativeImageURL} from "@shared/functions/images.ts";
import {getProductPagePath} from "../../lib/paths.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import BasketModifier from "../ticker/basketModifier/basketModifier.tsx";
import {ProductPrice} from "../price/productPrice/productPrice.tsx";
import {GenericProduct, GenericSingleProduct} from "@shared/types/productTypes.ts";

/** Displays a product or product group with an optional basket ticker. */
export default function Product(
    {prod, currency, horizontal = false, quantityLocked = false, admin = false, forceVertical = false}: {
    /** The product or product group to display. */
    prod: GenericProduct;
    /**
     * Whether the product should be forced to order content horizontally rather than vertically. Defaults to
     * `false`. <br>
     * This cannot be disabled if `quantityLocked` is `true` since all quantity locked products display horizontally.
     */
    horizontal?: boolean
    /**
     * If this `true`, the quantity of the product in the user's basket cannot be changed by this component. Defaults
     * to `false`.
     */
    quantityLocked?: boolean
    /** Show additional information about the product, such as the SKU. Defaults to `false` */
    admin?: boolean
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency
    /**
     * Forces the product to render vertically, even when horizontal space dictates that it should be horizontal.
     * Defaults to `false`
     */
    forceVertical?: boolean
}) {
    /** Name to display for the product, including SKU if in admin mode */
    let name: string;

    // Check whether product is a group or single product, and extract a representative product needed for some things.
    let representativeProduct: GenericSingleProduct;
    // prod is a group with multiple elements.
    if (Array.isArray(prod) && prod.length > 1) {
        prod = prod as ProductData[];
        representativeProduct = prod[0];
        name = representativeProduct.group_name || representativeProduct.name;

        // Cannot be quantity locked and a group, since groups don't have associated quantities.
        if (quantityLocked) {
            console.warn("Product component shouldn't be both quantity locked and displaying a product group")
        }
    }
    // prod is a group with a single element, or not a group
    else {
        // prod is a group with a single element
        if (Array.isArray(prod)) prod = prod[0];
        representativeProduct = prod;
        name = prod.name;
    }

    // Add SKU to name if in admin mode
    if (admin) {
        name += ` [SKU${representativeProduct.sku}]`
    }

    // Quantity locked products always display horizontal
    if (quantityLocked) {
        horizontal = true
    }

    /** Relative link to the dedicated product page. */
    const prodPagePath = getProductPagePath(representativeProduct.sku)

    return (
        <div className={"product"
            + (horizontal ? " horizontal-product" : "")
            + (forceVertical ? " vertical-product" : "")
        }>
            <HyperlinkedProductImage href={prodPagePath} prod={prod}/>

            {/* Bottom half of the product display */}
            <div className="prod-footer">
                {/* Primary content of the footer */}
                <div className="prod-footer-main">
                    <div className="product-text">
                        {/* Product Name + Link to dedicated product page, as well as SKU if in admin mode */}
                        <a className="product-name" href={prodPagePath}>{name}</a>
                        <ProductPrice prod={prod} currency={currency}/>
                    </div>

                    {!quantityLocked ? <div className='basket-modifier-container'>
                        <BasketModifier
                            product={prod}
                            inputId={`${representativeProduct.sku}-product-component-basket-modifier`}
                        />
                    </div> : null}
                </div>

                {/* On quantity locked components, show the quantity. */}
                {quantityLocked ? <ProductQuantity prod={representativeProduct}/> : null}

            </div>
        </div>
    )
}

/** Product Image + Link to dedicated product page **/
function HyperlinkedProductImage({href, prod}: { href: string, prod: GenericProduct }) {
    const reprImageUrl = getRepresentativeImageURL(prod)
    return (<a className="product-image-link" href={href}>
        <SquareImageBox image={reprImageUrl} size='100%'/>
    </a>)
}

function ProductQuantity({prod}: { prod: GenericSingleProduct }) {
    const quantity = "basketQuantity" in prod
        ? prod.basketQuantity
        : "quantity" in prod
            ? prod.quantity
            : null
    if (quantity === null) return null;

    return <div className="prod-footer-right prod-locked-quantity">
        <span>x</span><span>{quantity}</span>
    </div>
}