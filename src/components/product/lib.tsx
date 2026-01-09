import {JSX, useEffect, useState} from "react";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {compareProductGroups, compareProducts} from "../../lib/sortMethods.tsx";
import Product from "./product.tsx";
import {useGetGroupedProducts} from "../../lib/supabaseRPC.tsx";

/**
 * Hook to generate `<Product/>` components for all currently available product groups on Supabase.
 * @returns A list of objects containing `ProductData[]` groups and their associated `<Product/>` component.
 */
export function useGenerateProductComponents() {
    const [products, setProducts] = useState<{prod: ProductData[], component: JSX.Element}[]>([])
    const getProductsResponse = useGetGroupedProducts(undefined, true, true);
    const productGroups: ProductData[][] = getProductsResponse.data || []

    useEffect(() => {
        // Don't show products with no images
        const activeProductData: ProductData[][] = productGroups.filter(group => {
            const images = group.map(p => p.images).flat(1)
            return images.length > 0;
        });
        // Sort groups, then sort the products within those groups.
        activeProductData.sort(compareProductGroups)
        activeProductData.forEach((group) => {group.sort(compareProducts)})

        // If there are no active products, just return.
        if (activeProductData.length === 0) return

        const componentMap: typeof products = []
        activeProductData.forEach((prod, i) => {
            if (!prod || prod.length === 0) return;
            componentMap.push({
                prod,
                component: <Product prod={prod} key={i}/>
            })
        })

        setProducts(componentMap)
    }, [getProductsResponse.loading])

    return products;
}