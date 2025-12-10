import { createContext } from "react"
import { ProductData } from "./supabaseTypes"

// Compatibility re-export
export * from './supabaseTypes.ts'
export * from './stripeTypes.ts'
export * from './royalMailTypes.ts'
export * from './clockifyTypes.ts'

// ProductInBasket is a small augmentation of ProductData used on the frontend
export type ProductInBasket = ProductData & { basketQuantity: number }
export type Basket = ProductInBasket[]

// Site-wide settings fetched from the backend
export const SiteSettingsContext = createContext<SiteSettings>({})
export type SiteSettings = {
    kill_switch?: { enabled: boolean; message: string }
    session_notif?: { enabled: boolean; message: string; start_time: string; end_time: string }
    product_disabled_messages?: { disabled: string; out_of_stock: string; [key: string]: string }
    clockify_users?: { userID: string; name: string }[]
    [key: string]: any
}

/**
 * Interface should only be used for type validation with `VALIDATORS`
 * @see @shared/errors.ts
 */
export interface NetlifyFunctionError {
    message: string
    status?: number
}