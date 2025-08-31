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


/**
 * An order from the orders_compressed table
 */
export type OrdersCompressed = {
    placed_at: string
    email: string
    street_address: string
    country: string
    name: string
    fulfilled: boolean
    total_value: number
    postal_code: string
    id: string
    city: string
    delivery_cost?: number
    products: OrderProdCompressed[]
}

/**
 * A product from the orders_compressed table
 */
export type OrderProdCompressed = { 
    sku: number
    product_name: string
    weight: number
    quantity: number
    customs_description: string
    origin_country_code: string
    package_type_override: string
    category: {
        id: number
        name: string
    }
    line_value: number
    image_url: string
}

/**
 * A product from the order_products table
 */
export type OrderProduct = {
    order_id?: string
    product_sku: number,
    quantity: number,
    value: number
}

export type Order = {
    id?: string
    placed_at?: string,
    email: string,
    street_address: string,
    name: string,
    country: string,
    fulfilled: boolean,
    total_value: number,
    postal_code: string,
    products: OrderProdCompressed[],
    city: string
}

export type WebhookPayload = {
    type: 'UPDATE' | 'INSERT' | 'DELETE'
    table: string
    schema: string
    record: any
    old_record: any
}