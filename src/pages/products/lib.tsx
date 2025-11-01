import { createContext } from "react";
import { UnsubmittedProductData, UnsubmittedImageData } from "./productEditor/types";
import { ImageData, ProductData } from "@shared/types/types";
import { blank_product } from "../../lib/consts";

export const ProductContext = createContext<{
    basketQuant?: number, 
    setBasketQuant?: React.Dispatch<React.SetStateAction<number>>,
    setProduct?: React.Dispatch<React.SetStateAction<UnsubmittedProductData>>
    product: UnsubmittedProductData
    group: UnsubmittedProductData[]
    originalProd: ProductData
    hoveredVariant: UnsubmittedProductData | undefined
    setHoveredVariant?: React.Dispatch<React.SetStateAction<UnsubmittedProductData | undefined>>
}>({product: blank_product, originalProd: blank_product, group: [], hoveredVariant: blank_product});

/**
 * Extract the product SKU from the URL
 */
export function extractSKU(): number {
    // SKU is the last part of the subdirectory
    const path = window.location.pathname.split("/")
    const skuString = path[path.length-1]
    // Convert to number type and return
    return skuString as unknown as number; 
}

/**
 * Removes unsubmitted types from the product data,
 * leaving a clean ProductData type to use in other
 * places. This is useful to, for example, remove
 * unsubmitted images before updating the basket
 */
export function cleanseUnsubmittedProduct(product: UnsubmittedProductData): ProductData {
    const cleansedImages: ImageData[] = product.images?.filter((img): img is ImageData => "id" in img) ?? []
    const { images, ...rest } = product as unknown as Omit<ProductData, 'images'> & { images: (ImageData | UnsubmittedImageData)[] }
    return { ...rest, images: cleansedImages }
}