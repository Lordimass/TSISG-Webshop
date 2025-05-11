export const basket_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//shopping-basket.svg";
export const info_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";
export const show_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//show.webp"
export const hide_icon = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//hide.webp"

export const shipping_options: Array<{shipping_rate: string}> = [
    {shipping_rate: "shr_1RHo2w2ER8SiRgqKQRlNi65f"}, // UK + Channel Islands
    {shipping_rate: "shr_1RHp552ER8SiRgqK8R9YmKAY"}, // Europe Zones 1, 2, 3
    {shipping_rate: "shr_1RHp5n2ER8SiRgqKk37pZDTa"}, // World Zones 1, 2, 3 (Anything not in UK, Channel Islands, or EU)
] 

// Region definitions for the purpose of shipping
export const uk = ["GB", "GG", "JE", "IM"]
export const eu = ["IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL", "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ", "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ", "KG", "VA", "LI"]