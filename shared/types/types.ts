import { createContext } from "react"
import { ProductData } from "./supabaseTypes"

// Compatibility re-export
export * from './supabaseTypes.ts'
export * from './stripeTypes.ts'
export * from './royalMailTypes.ts'
export * from './clockifyTypes.ts'

// ProductInBasket is a small augmentation of ProductData used on the frontend
export type ProductInBasket = ProductData & { basketQuantity: number }
export type ProductsInBasket = ProductInBasket[]
/** The shape of the data in `localStorage.basket` */
export interface Basket {
    /** The products in the basket and their quantities */
    products: ProductInBasket[]
    /**
     * The date-time in milliseconds since epoch at which this version of the basket was last updated with
     * information from the database
     */
    lastUpdated: number
}

/** Represents a discrepency between the stock available for a product, and the quantity in the customer's basket. */
export type StockDiscrepency = Pick<ProductInBasket, "sku" | "name" | "stock" | "basketQuantity">

// Site-wide settings fetched from the backend
export const SiteSettingsContext = createContext<SiteSettings>({})
export type SiteSettings = {
    kill_switch?: { enabled: boolean; message: string }
    session_notif?: { enabled: boolean; message: string; startTime: string; endTime: string, duration: number }
    disabled_product_messages?: { disabled: string; out_of_stock: string; [key: string]: string }
    clockify_users?: { userID: string; name: string }[]
    [key: string]: any
}

/**
 * Interface should only be used for type validation with `VALIDATORS`
 * @see @shared/errors.ts
 */
export interface StatusedError {
    message: string
    status?: number
}