import { Type } from "typescript";
import { product } from "./components/products";
import { isNumeric } from "./utils";

export const basket_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg";
export const info_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";
export const show_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//show.webp";
export const hide_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//hide.webp";
export const back_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//back.webp"

export const shipping_options: Array<{shipping_rate: string}> = JSON.parse(import.meta.env.VITE_SHIPPING_RATES)

/*
Permissions
===========
Each of these numbers are the minimum rank value required (inclusive) to perform the respective action.
-1 signifies a logged out user, while other rank values map to the index of the rank name in the hierarchy below.
*/
export const hierarchy: string[] = ["staff", "manager", "superuser"]

// The maximum number of one product that can be ordered at a time, regardless of stock. This is a hard cap.
export const max_product_order = 10

// Region definitions for the purpose of shipping
export const uk = ["GB", "GG", "JE", "IM"]
export const eu = ["IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL", "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ", "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ", "KG", "VA", "LI"]

// Date time constants
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Editable Product Properties
export type EditableProductProp = {
    propName: keyof product
    displayName: string
    /** String to display after input field (e.g. units) */
    postfix?: string
    /** String to display before input field (e.g. units) */
    prefix?: string
    /** String to display next to display name as a hint for what should go in the box */
    tooltip?: string
    /** 
     * The permission required to edit this prop, by default all props are editable under the
     * edit_products permission, key allows specification of a further required permission.
     * These values also need to be kept up to date in updateProductData to be secure.
    */
    permission?: string
    /** Boolean method which returns true if the value passed is a valid value for this prop, false if not. */
    constraint: (value: string) => boolean
}

// When updating this, don't forget to also provide a parser in prodPage.tsx to allow conversion to the right type for the prop.
export const editableProductProps: EditableProductProp[] = [
    {
        propName: "sku",
        displayName: "SKU",
        tooltip: "The ID of this product.",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "inserted_at",
        displayName: "Created At",
        tooltip: "Timestamp at which this product was created",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "name",
        displayName: "Name",
        tooltip: "User facing name of the product. Max 50 characters.",
        constraint: (value: string) => typeof value == "string" && value.length <= 50
    },
    {
        propName: "price",
        displayName: "Price",
        tooltip: "The price of the product in GBP",
        postfix: "GBP",
        permission: "edit_price",
        constraint: (value: string) => isNumeric(value)
    },
    {
        propName: "stock",
        displayName: "Stock",
        tooltip: "The number of this product left in stock",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0
    },
    {
        propName: "category_id",
        displayName: "Category ID",
        tooltip: "The ID of the category that this product is in",
        constraint: (value: string) => isNumeric(value)
    },
    {
        propName: "active",
        displayName: "Active",
        tooltip: "Whether or not the product can be added to baskets or not. If it's already in a customers basket this does not remove it. Must be 'true' or 'false'",
        constraint: (value: string) => value.toLowerCase() == "true" || value.toLowerCase() == "false"
    },
    {
        propName: "weight",
        displayName: "Weight",
        postfix: "grams",
        tooltip: "The weight of a single product in grams.",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0
    },
    {
        propName: "customs_description",
        displayName: "Customs Description",
        tooltip: "A short description of the product for customs forms. max length: 50 characters",
        constraint: (value: string) => typeof value == "string" && value.length < 50
    },
    {
        propName: "origin_country_code",
        displayName: "Origin Country Code",
        tooltip: "The ISO 3166-1 alpha-3 country code of the country which this product had its final manufacturing stage in. e.g. \"CHN\" for \"China\"",
        constraint: (value: string) => typeof value == "string" && value.length == 3
    },
    {
        propName: "sort_order",
        displayName: "Sort Order",
        tooltip: "The order in which products are primarily sorted in, lower values appear sooner in the list.",
        constraint: (value: string) => isNumeric(value)
    },
    {
        propName: "description",
        displayName: "Description",
        tooltip: "The user facing description of the product, supports markdown (*italics*, **bold**, (links)[URL], etc.)",
        constraint: (value: string) => typeof value == "string"
    },
    {
        propName: "last_edited",
        displayName: "Last Edited",
        tooltip: "Timestamp at which this product was last edited",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "last_edited_by",
        displayName: "Last Edited By",
        tooltip: "The ID of the last person to edit this product",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
]

// Blank product as fallback before a product is fetched
export const blank_product: product = {
    sku: 0,
    inserted_at: new Date().toISOString(),
    fetched_at: new Date().toISOString(),
    last_edited: new Date().toISOString(),
    name: "...",
    price: 0,
    stock: 0,
    active: false,
    sort_order: 0,
    images: [],
    category_id: 0,
    category: {
        id: 0, 
        created_at: new Date().toISOString(),
        name: "...",
    },
    tags: []
}
