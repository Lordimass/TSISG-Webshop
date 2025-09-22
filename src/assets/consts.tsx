import { ProductData } from "../lib/types";

export const basket_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg";
export const info_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";
export const show_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//show.webp";
export const hide_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//hide.webp";
export const back_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//back.webp";
export const search_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/search.webp";

export const shipping_options: Array<{shipping_rate: string}> = JSON.parse(import.meta.env.VITE_SHIPPING_RATES)

/**
 * The number of days before an unfulfilled order is considered overdue
 */
export const overdue_threshold: number = 2;

/** The average character per second reading speed of a person. Used to calculate the length of time to show
 * a notification for based on its text length */
export const reading_speed_cps = 16;

// The maximum number of one product that can be ordered at a time, regardless of stock. This is a hard cap.
export const max_product_order: number = 10
/** The number of products per page */
export const productLoadChunks: number = 20;

/** The default page title, usually followed by something else like " - 404 Not Found" */
export const page_title: string = "This Shop Is So GAY"

// Region definitions for the purpose of shipping
export const uk = ["GB", "GG", "JE", "IM"]
export const eu = ["IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL", "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ", "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ", "KG", "VA", "LI"]

// Max character lengths for address fields, limited by Royal Mail API
export const CITY_FIELD_MAX_LENGTH = 64
export const ADDRESS_FIELD_MAX_LENGTH = 50
export const POSTAL_CODE_FIELD_MAX_LENGTH = 12

// Date time constants
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Blank product as fallback before a product is fetched
export const blank_product: ProductData = {
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
    tags: [],
    weight: 0,
    customs_description: "",
    description: "",
    origin_country_code: "",
    package_type_override: "",
    metadata: {}
}
