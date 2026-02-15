import {ProductData} from "@shared/types/supabaseTypes.ts";
import {fetchColumnsFromTable} from "@shared/functions/supabase.ts";
import {supabase} from "../../lib/supabaseRPC.tsx";
import {callRPC} from "@shared/functions/supabaseRPC.ts";
import {editableProductProps} from "./editableProductProps.ts";
import {useEffect, useState} from "react";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";

/**
 * Change the height of a text area to fit the text within it, meaning scrolling is never necessary.
 * @param el The text area to change the height of.
 */
export function autoResizeTextarea(el: HTMLTextAreaElement | null) {
    if (el) {
        el.style.height = 'auto'; // Reset
        el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
    }
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
    ) as { name: string }[]
    const tags = tagsRaw.map((tag) => tag.name)

    const categoriesRaw = await fetchColumnsFromTable(
        supabase,
        "product_categories",
        "id, name"
    ) as { id: number, name: string }[]
    const categories = categoriesRaw.map((category) => category.name)

    const groupNames = await callRPC("fetch_group_names", supabase) as string[]

    return {tags, category_id: categories, group_name: groupNames}
}

/**
 * Fetch the pretty, string display version of a property from a product.
 * @param propName The property of the product to fetch.
 * @param product The product from which to fetch the property.
 */
export function useParsedPropertyString(propName: keyof typeof editableProductProps, product: UnsubmittedProductData) {
    const [string, setString] = useState("");
    useEffect(() => {
        async function fetch() {
            const resp = await editableProductProps[propName]?.toStringParser(product)
            setString(resp ?? "")
        }
        fetch().then()
    }, [product])
    return string
}