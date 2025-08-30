import { UUID } from "crypto"

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

export type ImageData = {
    alt: string | null
    bucket_id: string
    display_order: number
    id: UUID
    image_url: string
    inserted_at: string
    metadata: any
    name: string
    path_tokens: string[]
    product_sku: number
}

export type CategoryData = {
  id: number,
  created_at: string
  name: string,
  description?: string
}

