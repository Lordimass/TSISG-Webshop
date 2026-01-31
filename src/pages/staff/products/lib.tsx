import {editableProductProps} from "../../../components/productPropertyEditor/editableProductProps.ts";

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