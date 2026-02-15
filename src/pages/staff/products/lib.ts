import {editableProductProps} from "../../../components/productPropertyEditor/editableProductProps.ts";
import {GenericSingleProduct, UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {createContext} from "react";
import {getRepresentativeImage} from "@shared/functions/images.ts";

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

export function compareProductsByKey(
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

export function compareProductGroupsByKey(
    a: UnsubmittedProductData[],
    b: UnsubmittedProductData[],
    T: keyof typeof editableProductProps,
    reverse: boolean = false
) {
    if (!a || !b) return 0

    // Empty groups
    if (a.length === 0 && b.length === 0) return 0
    // Just `a` empty
    if (a.length === 0) return reverse ? 1 : -1
    // Just `b` empty
    if (a.length === 0) return reverse ? -1 : 1

    // Use the first element of the group as a representative
    const reprA = {...a[0]}
    const reprB = {...b[0]}

    // Override names of representatives to make sorting by name use group name for groups.
    if (a.length > 1) reprA.name = reprA.group_name || ""
    if (b.length > 1) reprB.name = reprB.group_name || ""

    return compareProductsByKey(reprA,reprB,T,reverse)
}

export const ProductTableContext = createContext<{
    /** Method to set a product in the full, unfiltered list of products. */
    setProd: (p: UnsubmittedProductData) => void,
    /** List of the original versions of products on this table before any edits were made */
    originalGroups: ProductData[][],
    /** Products to display in the table */
    groupsState: [UnsubmittedProductData[][], (prods: UnsubmittedProductData[][]) => void]
    /** Lists of properties for autofill */
    propLists?: Partial<Record<keyof ProductData, string[]>>
    /** Sort the products in order of a given key */
    sort: (key: keyof typeof editableProductProps, reversed?: boolean) => void;
    /** Columns to show on the table */
    columnsState?: [typeof selectedColumns, (cols: typeof selectedColumns) => void]
}>({
    setProd: () => {},
    originalGroups: [],
    groupsState: [[], (_prods: UnsubmittedProductData[][]) => {}],
    sort: (_key: keyof typeof editableProductProps, _reversed?: boolean) => {}
})

export type ProductFilter = {
    filter: (p: GenericSingleProduct) => boolean,
    value: "Show" | "Hide",
}

export const productFilters: {[key: string]: ProductFilter} = {
    "Inactive": {filter: p => !p.active, value: "Hide"},
    "0-Stock": {filter: p => p.stock === 0, value: "Hide"},
    "Missing Image": {filter: p => !getRepresentativeImage(p), value: "Show"},
    "Name": {filter: _p => true, value: "Show"}
}

const DEFAULT_SELECTED_COLUMNS: (keyof typeof editableProductProps)[] = ["sku", "name", "price", "stock", "weight", "category_id", "group_name"]
export const selectedColumns: {
    [K in keyof typeof editableProductProps]?: boolean
} = {}
Object
    .keys(editableProductProps)
    .forEach(k => {
        const key = k as keyof typeof editableProductProps
        selectedColumns[key] = DEFAULT_SELECTED_COLUMNS.includes(key)
    })