import { CategoryData, ImageData } from "./supabaseTypes.mts"

export type Basket = ProductInBasket[]
export type ProductInBasket = {
  sku: number,
  name: string,
  price: number,
  basketQuantity: number,
  images: ImageData[]
  stock: number
  category: CategoryData
}

