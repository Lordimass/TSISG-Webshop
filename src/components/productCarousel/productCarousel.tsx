import "./productCarousel.css"
import {GenericSingleProduct} from "@shared/types/productTypes.ts";
import Product from "../product/product.tsx";
import {RefObject, UIEvent, useEffect, useRef, useState} from "react";

export default function ProductCarousel(
    {
        id, ref, products
    }: {
        id?: string,
        ref?: RefObject<HTMLDivElement | null>,
        /** Products to show on the carousel */
        products: GenericSingleProduct[]
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

    // Ref to the root carousel, also set to the ref passed as an argument in case it's needed externally.
    const carouselRef = ref ?? useRef<HTMLDivElement>(null);
    // Ref to the inner element of the carousel
    const innerRef = useRef<HTMLDivElement>(null);
    // Whether the component has initialised. Prevents bug with hot reloads during development due to baseWidth changes
    const hasInitialised = useRef(false);

    const baseWidth = useRef<number>(0);
    const [renderedProducts, setRenderedProducts] = useState<GenericSingleProduct[]>(products);

    useEffect(() => {
        if (hasInitialised.current) return;
        const carousel = carouselRef.current;
        const inner = innerRef.current;
        if (!carousel || !inner) return;

        const parentWidth = carousel.clientWidth;
        const innerWidth = inner.scrollWidth;
        baseWidth.current = innerWidth;

        // Duplicate product list to fill the space and add one set before and after
        const numDuplicates = Math.ceil(parentWidth / innerWidth) + 2;
        const duplicated: GenericSingleProduct[] = [];
        for (let i = 0; i < numDuplicates; i++) {
            duplicated.push(...products);
        }
        setRenderedProducts(duplicated);

        // Allow DOM to paint before setting scroll
        requestAnimationFrame(() => {
            carousel.scrollLeft = baseWidth.current;
        });

        hasInitialised.current = true;

    }, []);

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
            {renderedProducts.map((p, i) => <Product prod={p} key={i}/>)}
        </div>
    </div>
}