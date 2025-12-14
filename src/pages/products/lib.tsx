import { createContext } from "react";
import { UnsubmittedProductData, UnsubmittedImageData } from "./productEditor/types.ts";
import { ImageData, ProductData } from "@shared/types/types";
import { blank_product } from "../../lib/consts";
import {fetchColumnsFromTable} from "@shared/functions/supabase.ts";
import {supabase} from "../../lib/supabaseRPC.tsx";
import {callRPC} from "@shared/functions/supabaseRPC.ts";

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

/**
 * Fetches data for autofill, such as the list of tags and categories currently available.
 * @returns An object with keys corresponding to the type of autofill data, and values as lists of objects containing data on each item.
 * @example
  {
      categories: [{id: 1, name: "Magnets"}, {id: 2, name: "Pin Badges"}, ...],
      tags: [{name: "bisexual"}, {name: "lesbian"}, {name: "lgbt"}, ...]
  }
 */
export async function fetchPropAutofillData() {
    const tags = await fetchColumnsFromTable(
        supabase,
        "tags",
        "name"
    ) as {name: string}[]

    const categories = await fetchColumnsFromTable(
        supabase,
        "product_categories",
        "id, name"
    ) as {id: number, name: string}[]

    const groupNames = await callRPC("toggle_order_fulfilment", supabase) as string[]
    return {tags, categories, groupNames}
}