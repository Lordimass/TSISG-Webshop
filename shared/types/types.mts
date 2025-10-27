import { createContext } from "react"
import { ProductData } from "./supabaseTypes.mts"

// ProductInBasket is a small augmentation of ProductData used on the frontend
export type ProductInBasket = ProductData & { basketQuantity: number }
export type Basket = ProductInBasket[]

/** Additional information on the association between an image and its product. */
export type AssociationMetadata = {
  global?: boolean
  group_product_icon?: boolean
  group_representative?: boolean
  [key: string]: unknown
}

export type OrderProduct = {
  sku: number
  product_name: string
  quantity: number
  line_value: number
  image_url: string
}

export type Order = {
  id: number
  placed_at: string
  email: string
  street_address: string
  postal_code: string
  country: string
  name: string
  fulfilled: boolean
  total_value: number
  dispatched: boolean
  delivery_cost?: number
  products: OrderProduct[]
  royalMailData: {
    orderIdentifier: number
    orderReference?: string
    createdOn: string
    orderDate?: string
    printedOn?: string
    manifestedOn?: string
    shippedOn?: string
    trackingNumber?: string
  }
}

// Site-wide settings fetched from the backend
export const SiteSettingsContext = createContext<SiteSettings>({})
export type SiteSettings = {
  kill_switch?: { enabled: boolean; message: string }
  session_notif?: { enabled: boolean; message: string; start_time: string; end_time: string }
  product_disabled_messages?: { disabled: string; out_of_stock: string; [key: string]: string }
  clockify_users?: { userID: string; name: string }[]
  [key: string]: any
}
