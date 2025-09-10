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
  /** DEPRECATED: Please use category.id instead */
  category_id: number
  /** The category the product belongs to */
  category: CategoryData
  sort_order: number
  images: ImageData[]
  /** Weight of the product in grams */
  weight: number
  /** Description for customs forms */
  customs_description: string
  /** The ISO 3166-1 alpha-3 country code of the country which this product had its final manufacturing stage in. e.g. "CHN" for "China" */
  origin_country_code: string
  /** The user facing description of the product */
  description: string
  /** The tags attached to the product */
  tags: TagData[]
  /** For products which are too large to fit in smaller boxes, so require a specific minimum box size to send. */
  package_type_override: string
}

export type ImageData = {
  alt: string | undefined
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

export type TagData = {
  name: string
  created_at: string
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

/** Site-wide settings fetched from the backend, allowing for simple customisation and changes to be made without recompiling the whole thing */
export type SiteSettings = {
  /** Whether the webshop is disabled, useful in case of a critical fault. Message is shown to users in a notification */
  kill_switch?: {enabled: boolean, message: string}
  /** Notification to display to users at the start of their session */
  session_notif?: {enabled: boolean, message: string, start_time: string, end_time: string}
  /** Messages to display when products are disabled, varies based on the reason */
  product_disabled_messages?: { disabled: string, out_of_stock: string, [key: string]: string }
  /** Allows for arbitrary other settings that haven't been defined in this type */
  [key: string]: any 
}

