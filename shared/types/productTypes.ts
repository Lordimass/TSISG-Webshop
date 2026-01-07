import {ImageData, ProductData} from "./supabaseTypes.ts";
import {UnsubmittedImageData} from "../../src/pages/products/productEditor/types.ts";

/** A product of any form, so long as there is only one of them (i.e. no product groups) */
export type GenericSingleProduct = ProductData
    | UnsubmittedProductData
    | ProductInBasket
    | OrderProdCompressed

/** A product of any form, including product groups */
export type GenericProduct = GenericSingleProduct | GenericSingleProduct[]

/** A product with data that does not yet exist in the database. It is yet to be saved/submitted */
export type UnsubmittedProductData = Omit<ProductData, "images"> & {
    /**
     * All images associated with this product, both those that are uploaded already, and those that are still local,
     * unsaved changes.
     */
    images: (ImageData | UnsubmittedImageData)[]
}

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