import { UnsubmittedImageData } from "../pages/products/productEditor/types"
import { ImageData, ProductData } from "./types"

export function compareProducts(a: ProductData, b: ProductData) {
    // Primary: Sort by sort_order
    if (a.sort_order < b.sort_order) return -1
    if (a.sort_order > b.sort_order) return 1
    // Secondary: Sort by category
    if (a.category_id < b.category_id) return -1
    if (a.category_id > b.category_id) return 1
    // Tertiary: Sort alphabetically
    return a.name.localeCompare(b.name)
}

export function compareImages(a: ImageData | UnsubmittedImageData, b: ImageData | UnsubmittedImageData): number {
  if (a.display_order < b.display_order) {
    return -1;
  } else if (b.display_order < a.display_order) {
    return 1;
  }
  return 0;
}