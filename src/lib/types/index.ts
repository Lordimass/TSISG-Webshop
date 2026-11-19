import type {BasketProduct} from "./product.ts";

export * from "./product.ts"
export * from "./image.ts"
export * from "./locale.ts"
export * from "./shipping.ts"

export type StockDiscrepency = Pick<
  BasketProduct,
  "sku" | "name" | "stock" | "basketQuantity"
>;