import {ProductData} from "./supabaseTypes.ts";

/** A product in the user's basket, with a quantity */
export type ProductInBasket = ProductData & {
    /** The quantity of this product in the user's basket */
    basketQuantity: number
}

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

/**
 * A product from the orders_compressed table
 */
export type OrderProdCompressed = ProductData & {
    /** The value for these products, with quantity taken into account. */
    line_value: number
    /** The number of this product that was ordered */
    quantity: number
}