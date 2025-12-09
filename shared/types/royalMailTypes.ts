export type OrdersFromPageable = {
    orders: OrderFromPageable[]
}

export type OrderFromPageable = {
    orderIdentifier: number
    orderReference?: string
    /** ISO Date String */
    createdOn: string
    /** ISO Date String */
    orderDate?: string
    /** ISO Date String */
    printedOn?: string
    /** ISO Date String */
    manifestedOn?: string
    /** ISO Date String */
    shippedOn?: string
    trackingNumber?: string
}