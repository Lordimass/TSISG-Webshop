import { createContext, Dispatch, SetStateAction } from "react";
import { overdue_threshold } from "../../../lib/consts";
import {OrderReturned} from "@shared/types/supabaseTypes.ts";

export const OrdersContext = createContext<{
    orders: OrderReturned[];
    setOrders?: React.Dispatch<React.SetStateAction<OrderReturned[]>>
}>({orders: []})

export const OrderDropdownContext = createContext<{
    order?: OrderReturned
    setColourClass?: Dispatch<SetStateAction<"green" | "red" | "yellow">>
}>({})

export function getColourClass(order: OrderReturned) {
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