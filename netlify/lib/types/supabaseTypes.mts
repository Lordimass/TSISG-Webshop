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