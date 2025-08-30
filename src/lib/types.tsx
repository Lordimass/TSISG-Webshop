import { UUID } from "crypto"

export type ProductData = {
  sku: number,
  /** Time at which the product was added to the database as an ISO date string */
  inserted_at: string
  /** Time at which the product was fetched from the database as an ISO date string, representative of when this data was last confirmed valid */
  fetched_at: string
  /** The time which this data was last edited as an ISO date string. */
  last_edited: string
  /** The last person to edit this product */
  last_edited_by?: string
  /** Customer facing name of the product */
  name: string
  /** Price of product in GBP inc. Tax */
  price: number
  stock: number
  active: boolean
  category_id: number
  sort_order: number
  images: ImageData[]
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

