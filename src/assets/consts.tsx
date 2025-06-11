export const basket_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg";
export const info_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";
export const show_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//show.webp";
export const hide_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//hide.webp";

export const analytics_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/staff-portal-tab-icons/analytics.png";
export const order_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/staff-portal-tab-icons/order.png";
export const product_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/staff-portal-tab-icons/products.png";
export const refund_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/staff-portal-tab-icons/refund.png";
export const user_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/staff-portal-tab-icons/user.png";

export const shipping_options: Array<{shipping_rate: string}> = JSON.parse(import.meta.env.VITE_SHIPPING_RATES)

// Region definitions for the purpose of shipping
export const uk = ["GB", "GG", "JE", "IM"]
export const eu = ["IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL", "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ", "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ", "KG", "VA", "LI"]

// Date time constants
export const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
export const monthsOfYear = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]