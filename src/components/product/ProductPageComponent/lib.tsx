import {createContext, type Dispatch, type SetStateAction} from "react";
import {ProductData, ProductGroup} from "@/lib";

export const ProductContext = createContext<{
  setProduct: (p: ProductData) => void;
  product: ProductData;
  group?: ProductGroup;
  setGroup: (g: ProductGroup) => void;
  hoveredVariant?: ProductData;
  setHoveredVariant: Dispatch<SetStateAction<ProductData | undefined>>;
}>({
  product: ProductData.NULL,
  setProduct: _ => {},
  setGroup: _ => {} ,
  setHoveredVariant: _ => {},
});

/**
 * Extract the product SKU from the URL
 */
export function extractSKU(): number {
  // SKU is the last part of the subdirectory
  const path = window.location.pathname.split("/");
  const skuString = path[path.length - 1];
  // Convert to number type and return
  return skuString as unknown as number;
}
