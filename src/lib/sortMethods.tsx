import {UnsubmittedImageData} from "../pages/products/productEditor/types.ts"
import {GenericProductGroup, GenericSingleProduct, ImageData} from "@shared/types/types"
import {MergedOrder} from "@shared/types/supabaseTypes.ts";

export function compareProducts(a: GenericSingleProduct, b: GenericSingleProduct) {
  // Primary: Sort by sort_order
  if (a.sort_order < b.sort_order) return -1
  if (a.sort_order > b.sort_order) return 1
  // Secondary: Sort by category
  if (a.category.id < b.category.id) return -1
  if (a.category.id > b.category.id) return 1
  // Tertiary: Sort alphabetically
  return a.name.localeCompare(b.name)
}

export function compareProductsBySku(a: GenericSingleProduct, b: GenericSingleProduct) {
    return a.sku - b.sku
}

export function compareProductGroups(a: GenericProductGroup, b: GenericProductGroup) {
  // Handle groups with no products
  if (a.length === 0 && b.length === 0) return 0
  if (a.length === 0 && b.length > 0) return -1
  if (a.length > 0 && b.length === 0) return 1

  // Sort based on the first product in the group, presumed as the primary product
  return compareProducts(a[0], b[0])
}

export function compareImages(a: ImageData | UnsubmittedImageData, b: ImageData | UnsubmittedImageData): number {
  if (a.display_order < b.display_order) {
    return -1;
  } else if (b.display_order < a.display_order) {
    return 1;
  }
  return 0;
}

export function compareOrders(a:MergedOrder, b:MergedOrder) {
    const dateA = new Date(a.placed_at)
    const dateB = new Date(b.placed_at)
    // Place fulfilled orders after unfulfilled orders
    if (a.fulfilled && !b.fulfilled) {
        return 1
    } else if (b.fulfilled && !a.fulfilled) {
        return -1
    // Place oldest unfullfilled orders first
    } else if (!a.fulfilled && !b.fulfilled) {
        return dateA < dateB 
        ? -1 
        : dateA == dateB
            ? 0 
            : 1
    // Place most recent fulfilled orders first
    } else {
        return dateA < dateB 
        ? 1 
        : dateA == dateB 
            ? 0
            : -1
    }
}