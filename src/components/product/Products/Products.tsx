"use client";

import "./Products.css";
import {ProductCollection, ProductData, ProductGroup} from "@/lib";
import {type ReactNode, useContext, useEffect, useState} from "react";
import PageSelector from "../../Ticker/PageSelector/PageSelector";
import Product from "../Product";
import {type Currency} from "dinero.js";
import {LocaleContext} from "@/lib/context/locale.tsx";
import {trackViewItemList} from "@/lib/ga/events.ts";
import {GAItem} from "@/lib/types/ga.ts";

export interface ProductsProps {
    /**
     * Products to display. Accepts a string produced by {@link JSON.stringify} to allow products to be passed
     * by Server components
     * */
    prods: ProductCollection | string;
    /** Max elements to display before overflowing onto a new page. */
    pageSize?: number;
    /** Options for Google Analytics tracking, leaving this undefined will stop tracking for this list. */
    trackViewItemListProps?: {
        /**
         * The ID of the item list, `$page` will be replaced with the page number if applicable
         * @example "home_page_$page"
         */
        itemListId: string;
        /**
         * The name of the item list, `$page` will be replaced with the page number if applicable
         * @example "Home Page $page"
         */
        itemListName: string;
    };
    children?: ReactNode;
    /**
     * Whether products marked as `hidden` should be excluded from this view. Defaults to `true`
     */
    excludeHidden?: boolean;
    /**
     * Whether to allow this product images to be a comparison slider image, if applicable for that product. Defaults to `true`
     */
    allowComparisonSliderImage?: boolean
    /**
     * Hide the display of price and name from the products, saving some space. Defaults to `false`
     */
    hideText?: boolean
    /**
     * Forces the product to render vertically, even when horizontal space dictates that it should be horizontal.
     * Defaults to `false`
     */
    forceVertical?: boolean;
}

/**
 * Display a list of products, optionally paginated
 */
export default function Products(
    {
        prods,
        pageSize,
        trackViewItemListProps,
        children,
        excludeHidden = true,
        allowComparisonSliderImage = true,
        hideText = false,
        forceVertical = false,
    }: ProductsProps) {
    const products: ProductCollection = typeof prods === "string" ? ProductCollection.deserialise(prods) : prods;
    const { currency } = useContext(LocaleContext);
    const [page, setPage] = useState(1);
    const [toShow, setToShow] = useState<ProductCollection>(new ProductCollection());

    const pageCount = pageSize ? Math.ceil(products.length / pageSize) : undefined;

    useEffect(() => {
        console.log("Products: ", products)
        let newToShow = pageSize
            ? new ProductCollection(...products.slice((page - 1) * pageSize, page * pageSize))
            : products;

        paginatedTrackViewItemList(
            currency,
            newToShow,
            trackViewItemListProps,
            pageCount ? page : undefined,
        );

        setToShow(newToShow);
    }, [prods, page, pageCount]);

    return (
        <div className="products-box">
            {!toShow || toShow.length === 0 ? <p>There's nothing here...</p> : null}
            <div className="products">
                {children}
                {toShow.map((p, i) => {
                    console.log(p)
                    if (excludeHidden && (p instanceof ProductData && p.hidden
                        || p instanceof ProductGroup && p.isHidden()
                    )) return null;
                    return <Product
                        prod={p} key={i}
                        allowComparisonSliderImage={allowComparisonSliderImage}
                        hideText={hideText}
                        forceVertical={forceVertical}
                    />
                })}
            </div>
            {pageCount && pageCount > 1 ? (
                <PageSelector
                    id="product-list-page-selector"
                    pageCount={pageCount}
                    onChange={(e) => setPage(e)}
                />
            ) : null}
        </div>
    );
}

function paginatedTrackViewItemList(
    currency: Currency,
    items: (ProductData | ProductGroup)[],
    props?: ProductsProps["trackViewItemListProps"],
    page?: number,
) {
    if (!props) return;
    if (page) {
        props.itemListId.replace("$page", "" + page);
        props.itemListName.replace("$page", "" + page);
    }

    trackViewItemList(
        currency,
        items.map((p) => new GAItem(p)),
        props.itemListId,
        props.itemListName,
    );
}
