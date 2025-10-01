import { UUID } from "crypto"
import { createContext } from "react"

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
  /** Products with the same group name are displayed as one product with variants, instead of each as unique products. */
  group_name?: string
  /** Additional information on the product */
  metadata: {
    /** The name of this specific variant, if `group_name != undefined` */
    variant_name? : string
    [key: string]: unknown
  }
}

export type ImageData = {
  /** Alt text for the image */
  alt: string | undefined
  /** The identifier of the bucket that the image object belongs to */
  bucket_id: string
  /** The order to display this image in when in a list, higher numbers come later */
  display_order: number
  /** The identifier of the image object */
  id: UUID
  /** DEPRECATED: Use `id` instead. The direct access url of the image */
  image_url: string
  /** ISO timestamp of when the association was made between the image and the product */
  inserted_at: string
  /** The filename of the image */
  name: string
  /** String tokens representing the path through the bucket to obtain the image */
  path_tokens: string[]
  /** The SKU of the product this image is related to */
  product_sku: number
  /** Additional information on the image object itself */
  metadata: {[key: string]: unknown}
  /** Additional information on the association between the image and its product. */
  association_metadata: AssociationMetadata
}

/** Additional information on the association between an image and its product. */
export type AssociationMetadata = {
    /**
     * Whether this image is relevant to all products in the product group 
     * (if it exists), rather than just the SKU it's assigned to
     */
    global?: boolean

    /** 
     * Whether this image is to be used as an icon for the product when
     *  in a group, rather than as a standard product image 
    */
    group_product_icon?: boolean

    /** 
     * Whether this image is used to represent the group as a whole, rather
     * than an individual variant.
     */
    group_representative?: boolean

    [key: string]: unknown
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
export type ProductInBasket = ProductData & {basketQuantity: number}

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
    /** ISO Date String */
    createdOn: string
    /** ISO Date String */
    orderDate?: string
    /** ISO Date String */
    printedOn?: string
    /** ISO Date String */
    manifestedOn?: string
    /** ISO Date String */
    shippedOn?: string
    trackingNumber?: string
  }
}

export type OrderProduct = {
  sku: number,
  product_name: string,
  quantity: number,
  line_value: number,
  image_url: string
}

/** Site-wide settings fetched from the backend, allowing for simple customisation and changes to be made without recompiling the whole thing */
export const SiteSettingsContext = createContext<SiteSettings>({})
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

