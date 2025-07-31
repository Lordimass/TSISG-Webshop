export type OrdersCompressed = {
    placed_at: string
    email: string
    street_address: string
    country: string
    name: string
    fulfilled: boolean
    total_value: number
    postal_code: string
    id: string
    city: string
    delivery_cost?: number
    products: {
        sku: number
        product_name: string
        weight: number
        customs_description: string
        origin_country_code: string
        package_type_override: string
        category: {
            id: number
            name: string
        }
        line_value: number
        image_irl: string
    }[]
}