import {createContext, Dispatch, SetStateAction} from "react";
import { UnsubmittedImageData } from "./productEditor/types.ts";
import {ImageData, ProductData, UnsubmittedProductData} from "@shared/types/types";
import { blank_product } from "../../lib/consts.ts";
import {fetchColumnsFromTable} from "@shared/functions/supabase.ts";
import {supabase} from "../../lib/supabaseRPC.tsx";
import {callRPC} from "@shared/functions/supabaseRPC.ts";

export const ProductContext = createContext<{
    basketQuant?: number, 
    setBasketQuant?: Dispatch<SetStateAction<number>>,
    setProduct?: Dispatch<SetStateAction<UnsubmittedProductData>>
    product: UnsubmittedProductData
    group: UnsubmittedProductData[]
    originalProd: ProductData
    hoveredVariant: UnsubmittedProductData | undefined
    setHoveredVariant?: Dispatch<SetStateAction<UnsubmittedProductData | undefined>>
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
 * @returns An object with keys from ProductData corresponding to the type of autofill data, and values as lists of
 * strings to use as autofill data for each key.
 * @example
  {
      category_id: [{id: 1, name: "Magnets"}, {id: 2, name: "Pin Badges"}, ...],
      tags: [{name: "bisexual"}, {name: "lesbian"}, {name: "lgbt"}, ...],
      ...
  }
 */
export async function fetchPropAutofillData(): Promise<Partial<Record<keyof ProductData, string[]>>> {
    // Fetch tags
    const tagsRaw = await fetchColumnsFromTable(
        supabase,
        "tags",
        "name"
    ) as {name: string}[]
    const tags = tagsRaw.map((tag) => tag.name)

    const categoriesRaw = await fetchColumnsFromTable(
        supabase,
        "product_categories",
        "id, name"
    ) as {id: number, name: string}[]
    const categories = categoriesRaw.map((category) => category.name)

    const groupNames = await callRPC("fetch_group_names", supabase) as string[]

    return {tags, category_id: categories, group_name: groupNames}
}