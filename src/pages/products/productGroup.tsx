import {UnsubmittedImageData, UnsubmittedProductData} from "./productEditor/types.ts";
import {useContext, useEffect, useRef} from "react";
import {LocaleContext} from "../../localeHandler.ts";
import {getProductPagePath} from "../../lib/paths.ts";
import {triggerViewItem} from "../../lib/analytics/analytics.tsx";
import {cleanseUnsubmittedProduct, ProductContext} from "./lib.tsx";
import {ImageData} from "@shared/types/supabaseTypes.ts";
import {getImageURL} from "@shared/functions/images.ts";
import DineroFactory from "dinero.js";
import {SquareImageBox} from "../../components/squareImageBox/squareImageBox.tsx";
import Price from "../../components/price/price.tsx";

export function ProductGroup() {
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

    if (group.length === 0) {
        return <></>
    }
    return (<>
        <p className="p-small">Variant: {name}</p>
        <div className="product-group" ref={groupRef}>
            {group.map(p => <ProductVariant product={p} key={p.sku}/>)}
        </div>
    </>)
}

function ProductVariant(
    {product}: {
        product: UnsubmittedProductData
    }
) {
    const {currency} = useContext(LocaleContext)

    async function changeProduct() {
        if (!setProduct) return
        setProduct(product)
        window.history.pushState(undefined, product.name, getProductPagePath(product.sku))
        await triggerViewItem(cleanseUnsubmittedProduct(product), currency)
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
    // TODO: Have variant icons stored in their own bucket which contains significantly smaller icons (they only need to
    //  be 100px max anyways)

    const {product: mainProduct, setProduct, setHoveredVariant} = useContext(ProductContext)
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

    const priceUnits = Math.round(product.price * 100)
    const dinero = DineroFactory({amount: priceUnits, currency: "GBP", precision: 2})

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
        <Price baseDinero={dinero}/>

    </button>);
}