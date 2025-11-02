import { createContext, Dispatch, SetStateAction } from "react";
import { Order } from "@shared/types/types";
import { overdue_threshold } from "../../../lib/consts";

export const OrdersContext = createContext<{
    orders: Order[]
    setOrders?: React.Dispatch<React.SetStateAction<Order[]>>
}>({orders: []})

export const OrderDropdownContext = createContext<{
    order?: Order
    setColourClass?: Dispatch<SetStateAction<"green" | "red" | "yellow">>
}>({})

export function getColourClass(order: Order) {
    const today = new Date()
    const date = new Date(order.placed_at)
    const timeDifference = Math.floor((today.getTime() - date.getTime())/(86400000));

    const newColourClass = order.fulfilled 
        ? "green" 
        : timeDifference > overdue_threshold 
            ? "red" 
            : "yellow"

    return newColourClass
}