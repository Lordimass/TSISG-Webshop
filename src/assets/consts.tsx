export const basket_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg";
export const info_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";
export const show_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//show.webp";
export const hide_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//hide.webp";

export const shipping_options: Array<{shipping_rate: string}> = JSON.parse(import.meta.env.VITE_SHIPPING_RATES)

export const max_product_order: number = 10

// The default page title, usually followed by something else like " - 404 Not Found"
export const page_title: string = "This Shop Is So GAY"
// The keywords meta tag to include on every page, this can be added to to include extra tags
export const keywords_meta: string = "gay,queer,lgbt,lgbtq,lgbtq+,shop,quality,pin badges,gift,bisexual,trans,transgender,bi,pansexual,pan,"

// Region definitions for the purpose of shipping
export const uk = ["GB", "GG", "JE", "IM"]
export const eu = ["IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL", "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ", "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ", "KG", "VA", "LI"]

// Max character lengths for address fields, limited by Royal Mail API
export const CITY_FIELD_MAX_LENGTH = 64
export const ADDRESS_FIELD_MAX_LENGTH = 50

// Date time constants
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
