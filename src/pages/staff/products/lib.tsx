import {editableProductProps} from "../../../components/productPropertyEditor/editableProductProps.ts";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {createContext} from "react";

const productTableHeaderKeysOrder: (keyof typeof editableProductProps)[] = [
    "sku", "name", "price", "sort_order", "stock", "weight", "active", "category_id", "group_name", "last_edited_by",
    "last_edited"
]
export function compareProductTableHeaderKeys(a: string, b: string) {
    const aIndex = productTableHeaderKeysOrder.indexOf(a as keyof typeof editableProductProps)
    const bIndex = productTableHeaderKeysOrder.indexOf(b as keyof typeof editableProductProps)
    if (aIndex != -1 && bIndex != -1) return aIndex - bIndex
    else if (aIndex != -1 && bIndex == -1) return -1
    else if (aIndex == -1 && bIndex != -1) return 1
    return 0
}

export function compareProductByKey(
    a: UnsubmittedProductData,
    b: UnsubmittedProductData,
    T: keyof typeof editableProductProps,
    reverse: boolean = false
) {
    if (!a || !b) return 0
    const [aT, bT] = [a[T], b[T]]
    if (aT == null) return reverse ? 1 : -1
    if (bT == null) return reverse ? -1 : 1
    if (aT == bT) return a.sku < b.sku ? -1 : 1
    if (aT < bT) return reverse ? 1 : -1
    if (aT > bT) return reverse ? -1 : 1
    return 0
}

export const ProductTableContext = createContext<{
    /** Method to set a product in the full, unfiltered list of products. */
    setProd?: (p: UnsubmittedProductData) => void,
    /** List of the original versions of products on this table before any edits were made */
    originalProds: ProductData[],
    /** Products to display in the table */
    prodsState: [UnsubmittedProductData[], (prods: UnsubmittedProductData[]) => void]
    /** Lists of properties for autofill */
    propLists?: Partial<Record<keyof ProductData, string[]>>
    /** Sort the products in order of a given key */
    sort: (key: keyof typeof editableProductProps, reversed?: boolean) => void;
}>({
    setProd: () => {},
    originalProds: [],
    prodsState: [[], (_prods: UnsubmittedProductData[]) => {}],
    sort: (_key: keyof typeof editableProductProps, _reversed?: boolean) => {}
})