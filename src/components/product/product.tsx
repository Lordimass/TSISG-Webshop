"use client";

import {type Currency} from "dinero.js";
import {BasketProduct, ProductData, ProductGroup,} from "@/lib";
import ProductPrice from "../Price/ProductPrice/ProductPrice.tsx";
import BasketModifier from "../Ticker/BasketModifier/BasketModifier.tsx";
import SquareImageBox from "../SquareImageBox/SquareImageBox.tsx";
import "./Product.css"
import CompareSliderAuto from "@/components/CompareSliderAuto/CompareSliderAuto.tsx";
import {getProductPagePath} from "@/lib/paths.ts";

interface ProductProps {
    /** The product or product group to display. */
    prod: ProductData | ProductGroup;
    /**
     * Whether the product should be forced to order content horizontally rather than vertically. Defaults to
     * `false`. <br>
     * This cannot be disabled if `quantityLocked` is `true` since all quantity locked products display horizontally.
     */
    horizontal?: boolean;
    /**
     * If this `true`, the quantity of the product in the user's basket cannot be changed by this component. Defaults
     * to `false`.
     */
    quantityLocked?: boolean;
    /** Override currency to display. Only use to display a currency other than the user's local currency. */
    currency?: Currency;
    /**
     * Forces the product to render vertically, even when horizontal space dictates that it should be horizontal.
     * Defaults to `false`
     */
    forceVertical?: boolean;
    /**
     * Whether to allow this product's image to be a comparison slider image, if applicable for the product. Defaults to `true`
     */
    allowComparisonSliderImage?: boolean
    /**
     * Hide the display of price and name from the product, saving some space. Defaults to `false`
     */
    hideText?: boolean
}

/** Displays a product or product group with an optional basket ticker. */
export default function Product(
    {
        prod,
        currency,
        horizontal = false,
        quantityLocked = false,
        forceVertical = false,
        allowComparisonSliderImage = true,
        hideText = false
    }: ProductProps) {
    /** Name to display for the product, including SKU if in admin mode */
    let name: string;

    // Check whether product is a group or single product, and extract a representative product needed for some things.
    let representativeProduct: ProductData;
    // prod is a group with multiple elements.
    if (prod instanceof ProductGroup && prod.products.length > 1) {
        representativeProduct = prod.products[0];
        name = prod.groupName || representativeProduct.name;

        // Cannot be quantity locked and a group, since groups don't have associated quantities.
        if (quantityLocked) {
            console.warn(
                "Product component shouldn't be both quantity locked and displaying a product group",
            );
        }
    }
    // prod is a group with a single element, or not a group
    else {
        // prod is a group with a single element
        if (prod instanceof ProductGroup) prod = prod.products[0];
        representativeProduct = prod;
        name = prod.name;
    }

    // Quantity locked products always display horizontal
    if (quantityLocked) {
        horizontal = true;
    }

    /** Relative link to the dedicated product page. */
    const prodPagePath = getProductPagePath(representativeProduct.sku);

    return (
        <div
            className={
                "product" +
                (horizontal ? " horizontal-product" : "") +
                (forceVertical ? " vertical-product" : "")
            }
        >
            <HyperlinkedProductImage href={prodPagePath} prod={prod} allowComparisonSliderImage={allowComparisonSliderImage}/>

            {/* Bottom half of the product display */}
            <div className="prod-footer">
                {/* Primary content of the footer */}
                <div className="prod-footer-main">
                    {!hideText ? <div className="product-text">
                        {/* Product Name + Link to dedicated product page, as well as SKU if in admin mode */}
                        <a className="product-name" href={prodPagePath}>
                            {name}
                        </a>
                        <ProductPrice prod={prod} currency={currency} />
                    </div> : null}

                    {!quantityLocked ? (
                        <div className="basket-modifier-container">
                            <BasketModifier
                                product={prod}
                                inputId={`${representativeProduct.sku}-product-component-basket-modifier`}
                            />
                        </div>
                    ) : null}
                </div>

                {/* On quantity locked components, show the quantity. */}
                {quantityLocked ? (
                    <ProductQuantity prod={representativeProduct} />
                ) : null}
            </div>
        </div>
    );
}

/** Product Image + Link to dedicated product page **/
function HyperlinkedProductImage(
    {
        href,
        prod,
        allowComparisonSliderImage
    }: {
    href: string;
    prod: ProductData | ProductGroup;
    allowComparisonSliderImage: boolean;
}) {
    const comparisonImages = allowComparisonSliderImage
        ? prod.getComparisonImages()
        : [];

    const representativeImage = prod.getRepresentativeImage();
    return (
        <a className="product-image-link" href={href}>
            {comparisonImages.length >= 2
                ? <CompareSliderAuto itemOne={comparisonImages[0]} itemTwo={comparisonImages[1]}/>
                : <SquareImageBox image={representativeImage} size="100%" />
            }
        </a>
    );
}

function ProductQuantity({ prod }: { prod: ProductData }) {
    let quantity: number | undefined;
    if ("basketQuantity" in prod) {
        quantity = (prod as BasketProduct).basketQuantity;
    }
    // Not just checking for != because this would exclude 0 quantity.
    if (quantity === undefined || quantity === null) {
        return null;
    }

    return (
        <div className="prod-footer-right prod-locked-quantity">
            <span>x</span>
            <span>{quantity}</span>
        </div>
    );
}
