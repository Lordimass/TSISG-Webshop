import {ProductData} from "@shared/types/types";

/** The number of days before an unfulfilled order is considered overdue */
export const overdue_threshold: number = 2;

/** 
 * The average character per second reading speed of a person. Used to calculate the length of time to show
 * a notification for based on its text length 
*/
export const reading_speed_cps = 16;

/** The maximum number of one product that can be ordered at a time, regardless of stock. This is a hard cap. */
export const MAX_PRODUCT_ORDER: number = 10
/** The number of products per page */
export const productLoadChunks: number = 20;

/** The default page title, usually followed by something else like " - 404 Not Found" */
export const page_title: string = "This Shop Is So GAY"

// Date time constants
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// Blank product as fallback before a product is fetched
export const blank_product: ProductData = {
    sku: 0,
    inserted_at: new Date().toISOString(),
    last_edited: new Date().toISOString(),
    last_edited_by: "",
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
        description: null
    },
    tags: [],
    weight: 0,
    description: "",
    origin_country_code: "",
    package_type_override: "",
    metadata: {},
    group_name: null,
    customs_description: null,
    extended_customs_description: null,
}
