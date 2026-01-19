import "./productCarousel.css"
import {GenericProduct} from "@shared/types/productTypes.ts";
import Product from "../product/product.tsx";
import {RefObject, UIEvent, useEffect, useRef, useState} from "react";
import {blank_product} from "../../lib/consts.ts";

export default function ProductCarousel(
    {
        id, ref, products
    }: {
        id?: string,
        ref?: RefObject<HTMLDivElement | null>,
        /** Products to show on the carousel */
        products?: GenericProduct[]
    }) {
    function handleScroll(e: UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        const bw = baseWidth.current;

        if (bw === 0) return;

        const left = el.scrollLeft;

        // backwards wrap
        if (left < bw) el.scrollLeft = 2 * bw - (bw - left)
        // forward wrap
        else if (left > bw * 2) el.scrollLeft = left % (bw * 2) + bw
    }

    function reinitialiseCarousel() {
        const carousel = carouselRef.current;
        const inner = innerRef.current;
        if (!carousel || !inner) return;

        // Render ONE cycle first
        setRenderedProducts(safe_products);

        requestAnimationFrame(() => {
            const singleCycleWidth = inner.scrollWidth;
            baseWidth.current = singleCycleWidth;

            const parentWidth = carousel.clientWidth;

            const numCycles =
                singleCycleWidth >= parentWidth
                    ? 3
                    : Math.ceil(parentWidth / singleCycleWidth) + 2;

            const duplicated: GenericProduct[] = [];
            for (let i = 0; i < numCycles; i++) {
                duplicated.push(...safe_products);
            }

            setRenderedProducts(duplicated);

            requestAnimationFrame(() => {
                carousel.scrollLeft = baseWidth.current;
                requestAnimationFrame(() => {
                });
            });
        });
    }

    // Ref to the root carousel, also set to the ref passed as an argument in case it's needed externally.
    const carouselRef = ref ?? useRef<HTMLDivElement>(null);
    // Ref to the inner element of the carousel
    const innerRef = useRef<HTMLDivElement>(null);

    const baseWidth = useRef<number>(0);
    // Use a blank product if no products supplied
    const safe_products = products && products.length > 0 ? products : [blank_product];
    const [renderedProducts, setRenderedProducts] = useState<GenericProduct[]>(safe_products);

    // Use a key representing the list of products to check whether the list has actually changed between renders.
    const lastCycleKey = useRef<string | null>(null);
    const cycleKey =
        products && products.length > 0
            ? products.map(p => {
                p instanceof Array ? p[0].sku : p.sku
            }).join("|")
            : "blank";

    useEffect(() => {
        if (lastCycleKey.current === cycleKey) return;
        lastCycleKey.current = cycleKey;
        reinitialiseCarousel();
    }, [cycleKey]);

    useEffect(() => {
        const carousel = carouselRef.current;
        if (!carousel) return;

        let lastWidth = carousel.scrollWidth;

        const observer = new ResizeObserver(() => {
            const newWidth = carousel.scrollWidth;
            // Ignore tiny changes
            if (Math.abs(newWidth - lastWidth) < 5) return;
            lastWidth = newWidth;
            reinitialiseCarousel();
        });

        observer.observe(carousel);

        return () => observer.disconnect();
    }, [cycleKey]);

    return <div
        className="product-carousel"
        id={id}
        ref={carouselRef}
        onScroll={(e) => handleScroll(e)}
    >
        <div
            className="product-carousel-inner"
            ref={innerRef}
        >
            {renderedProducts.map((p, i) => <Product prod={p} key={i} forceVertical/>)}
        </div>
    </div>
}