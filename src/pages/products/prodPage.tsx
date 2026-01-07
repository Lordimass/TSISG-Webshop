import {useContext, useEffect, useRef, useState} from "react"
import {blank_product} from "../../lib/consts.ts"
import "./prodPage.css"
import Markdown from "react-markdown"
import {LoginContext} from "../../app"
import {ProductData, UnsubmittedProductData} from "@shared/types/types"
import ProductEditor from "./productEditor/productEditor"
import {getGroup} from "../../lib/lib"
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
import BasketModifier from "../../components/ticker/basketModifier/basketModifier.tsx";

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
                <div className="prod-ticker">
                    <ProductGroup/>
                    {prod
                        ? <BasketModifier inputId={"prod-page-basket-modifier"} product={prod!} height={"50px"}/>
                        : null
                    }

                </div>
            </div>

            {isEditMode ? <ProductEditor/> : <></>}

        </ProductContext.Provider></Page>)
}