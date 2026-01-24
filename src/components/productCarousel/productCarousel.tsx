import "./productCarousel.css"
import {GenericProduct} from "@shared/types/productTypes.ts";
import Product from "../product/product.tsx";
import {RefObject, UIEvent, useEffect, useRef, useState} from "react";
import {blank_product} from "../../lib/consts.ts";

/** An infinitely scrollable carousel of products. */
export default function ProductCarousel(
    {
        id, ref, products, autoscroll = true
    }: {
        id?: string,
        ref?: RefObject<HTMLDivElement | null>,
        /** Products to show on the carousel */
        products?: GenericProduct[],
        /** Whether the carousel should automatically scroll through the product list */
        autoscroll?: boolean
    }) {
    /** Start autoscrolling the carousel */
    function startAutoScroll() {
        let lastTime = performance.now();

        function step(delta: number, time: number) {
            if (!carouselRef.current) return;
            lastTime = time;

            // scroll speed in px per second
            const speed = 17;
            const diff = Math.abs(speed * delta)/1000;
            if (diff < 1) {
                requestAnimationFrame(time => {
                    const newDelta = time - lastTime;
                    step(newDelta + delta, time)
                });
            } else {
                // Don't move if the carousel is hovered
                carouselRef.current.scrollLeft += isCarouselHovered.current ? 0 : diff;
                requestAnimationFrame(time => {
                    step(time - lastTime, time)
                });
            }
        }
        requestAnimationFrame(time => {step(0, time)});
    }

    /** Handle user scrolling the carousel */
    function handleScroll(e: UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        const bw = baseWidth.current;

        if (bw === 0) return;

        const left = el.scrollLeft;

        // backwards wrap
        if (left < bw) {
            el.scrollLeft = 2 * bw - (bw - left)
            isUserAdjustingScroll.current = true;
        }
        // forward wrap
        else if (left > bw * 2) {
            el.scrollLeft = left % (bw * 2) + bw;
            isUserAdjustingScroll.current = true;
        }
        requestAnimationFrame(() => { isUserAdjustingScroll.current = false });
    }

    /** Reinitialise the carousel, measuring width and automatically determining how many duplicates to make */
    function reinitialiseCarousel() {
        const carousel = carouselRef.current;
        const inner = innerRef.current;
        if (!carousel || !inner) return;

        // Render ONE cycle first
        setRenderedProducts(safe_products);

        // Wait for render to complete before measuring.
        requestAnimationFrame(() => {
            const singleCycleWidth = inner.scrollWidth;
            baseWidth.current = singleCycleWidth;

            const parentWidth = carousel.clientWidth;

            const numCycles = singleCycleWidth >= parentWidth
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
    // Ref to the inner element of the carousel.
    const innerRef = useRef<HTMLDivElement>(null);

    // Width of the full set of products without any duplication.
    const baseWidth = useRef<number>(0);

    // Whether the user is currently the one scrolling, used to fix a jittering bug on rerender.
    const isUserAdjustingScroll = useRef(false);

    // Whether the user is hovering over the carousel.
    const isCarouselHovered = useRef(false);

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

    // Reinitialise the carousel if the products list changes
    useEffect(() => {
        if (lastCycleKey.current === cycleKey) return;
        lastCycleKey.current = cycleKey;
        reinitialiseCarousel();
    }, [cycleKey]);

    // Reinitialise the carousel if the width available changes
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

    // Start autoscrolling on mount
    useEffect(() => {
        if (!autoscroll) return;
        startAutoScroll();
    }, []);

    return <div
        className="product-carousel"
        id={id}
        ref={carouselRef}
        onScroll={(e) => handleScroll(e)}
        onMouseEnter={() => isCarouselHovered.current = true}
        onMouseLeave={() => isCarouselHovered.current = false}
    >
        <div
            className="product-carousel-inner"
            ref={innerRef}
        >
            {renderedProducts.map((p, i) => <Product prod={p} key={i} forceVertical/>)}
        </div>
    </div>
}