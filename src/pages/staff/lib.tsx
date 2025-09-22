import { createContext } from "react";
import { Order } from "../../lib/types";

export const OrdersContext = createContext<{
    orders: Order[]
    setOrders?: React.Dispatch<React.SetStateAction<Order[]>>
}>({orders: []})