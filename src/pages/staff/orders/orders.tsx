import {useContext, useEffect, useRef, useState} from "react";

import Throbber from "../../../components/throbber/throbber";

import {LoginContext} from "../../../app";
import {useGetOrderList} from "../../../lib/netlifyFunctions";
import {compareOrders} from "../../../lib/sortMethods";
import {overdue_threshold} from "../../../lib/consts.ts";
import {getColourClass, OrderDropdownContext, OrdersContext} from "./lib";
import {dateToDateString, dateToTimeString} from "../../../lib/lib";
import {NotificationsContext} from "../../../components/notification/lib";

import "./orders.css"
import ObjectListItem from "../../../components/objectListItem/objectListItem";
import AuthenticatedPage from "../../../components/page/authenticatedPage";
import {MergedOrder} from "@shared/types/supabaseTypes.ts";
import DineroFactory, {Currency} from "dinero.js";
import {callRPC, toggleOrderFulfilment} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";
import {DEFAULT_CURRENCY} from "../../../localeHandler.ts";
import Product from "../../../components/product/product.tsx";

export function OrderManager() { 
    const unsetOrders: MergedOrder[] = useGetOrderList() || []
    const [orders, setOrders] = useState<MergedOrder[]>([])
    useEffect(() => {
        if (unsetOrders.length > 0) setOrders(unsetOrders)
    }, [unsetOrders])

    orders.sort(compareOrders)
    const loginContext = useContext(LoginContext)
    const [accessible, setAccessible] = useState(false)
    useEffect(() => {
        setAccessible(loginContext.permissions.includes("manage_orders"))
    }, [loginContext]) 

    return (<AuthenticatedPage
        requiredPermission="manage_orders"
        id="order-manager-content"
        title="TSISG STAFF - Order Manager"
        noindex={true}
        canonical="https://thisshopissogay.com/staff/orders"
        loadCondition={orders.length > 0}
        loadingText="Loading orders"
    >
        <OrdersContext.Provider value={{orders, setOrders}}>
        {orders  
            ? (orders.map((order: any) => <OrderDisplay key={order.id} order={order}/>))
            : null
        }
        </OrdersContext.Provider>
    </AuthenticatedPage>
)
}

function OrderDisplay({order}:{order:MergedOrder}) {
    const date = new Date(order.placed_at)
    const today = new Date()
    const timeDifference = Math.floor((today.getTime() - date.getTime())/(86400000));
    const [colourClass, setColourClass] = useState<"green" | "red" | "yellow">(getColourClass(order))

    const dateString = dateToDateString(date)

    return (<>
    <OrderDropdownContext.Provider value={{order, setColourClass}}>
    <ObjectListItem style={colourClass} dropdown={<OrderDropdown/>}>
        <p className="order-id">ID: {order.id}</p>
        <p> 
            Order for {order.name}:
            {" " + dateString}.<br/>
            {order.fulfilled ? <b> FULFILLED</b> :
            timeDifference > overdue_threshold ? <b>OVERDUE BY {timeDifference-overdue_threshold} DAYS</b> :
            <b> UNFULFILLED {order.dispatched ? " | Package handed to Royal Mail, Mark As Fulfilled." : ""}</b>
            }
        </p>
    </ObjectListItem>
    </OrderDropdownContext.Provider>
    </>)
}

function OrderDropdown() {
    async function toggleFulfilment() {
        if (toggleInProgress || !order || !setColourClass) return
        setToggleInProgress(true);

        try { // Toggle order fulfilment
            const new_order = await toggleOrderFulfilment(supabase, order.id)
            order.fulfilled = new_order.fulfilled
        } catch (e: unknown) {notify(`Something went wrong toggling order fulfilment! ${JSON.stringify(e)}`)}

        // Update colour of the display.
        setColourClass(getColourClass(order))
        setToggleInProgress(false);  
    }

    async function setDeliveryCost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!order) return

        // Update Supabase
        const val = deliveryCostInput.current?.value ?? "s"
        if (+val <= 0) {notify("Cost must be a valid number greater than 0!"); return}
        try {
            await callRPC("update_delivery_cost", supabase, {order_id: order.id, new_cost: val}, notify)
        } catch (e) {notify(`Something went wrong setting delivery cost! ${JSON.stringify(e)}`)}

        // Update the order state
        const newOrders = orders.map(o => {
            if (o.id !== order.id) return o
            else return {...o, delivery_cost: +val}
        })
        setOrders!(newOrders)
    }

    const {notify} = useContext(NotificationsContext)
    const {orders, setOrders} = useContext(OrdersContext)
    const {order, setColourClass} = useContext(OrderDropdownContext)
    if (!order) return null

    const [toggleInProgress, setToggleInProgress] = useState(false)

    const date = new Date(order.placed_at)
    const shippedOn = order.dispatched ? new Date(order.royalMailData!.shippedOn!) : new Date()
    const dateString = dateToDateString(date)
    const timeString = dateToTimeString(date)
    const deliveryCostInput = useRef<HTMLInputElement | null>(null)
    const totalValueDinero = DineroFactory({
        amount: Math.round((order.value.total || order.total_value)*100),
        currency: (order.value.currency || DEFAULT_CURRENCY) as Currency
    })
    const shippingDinero = (order.value.shipping) ? DineroFactory({
        amount: Math.round((order.value.shipping || 0)*100),
        currency: DEFAULT_CURRENCY
    }) : undefined
    return (<>
        <div className="order-values">
            Short ID: {order.id.slice(0,40)} <br/>
            {order.royalMailData ? <>Royal Mail ID: {order.royalMailData.orderIdentifier}<br/></> : <></>}
            Name: {order.name}<br/>
            Email: {order.email}<br/>
            Placed at: {dateString}, {timeString}<br/>
            Street Address: {order.street_address}<br/>
            Postal Code: {order.postal_code}<br/>
            Country: {order.country}<br/>
            Total Value: {totalValueDinero.toFormat("$0.00")}<br/>
            {shippingDinero ? <>Royal Mail Delivery Cost: {shippingDinero.toFormat("$0.00")}<br/></> : <></>}
            {order.dispatched ? <>Dispatched: {dateToDateString(shippedOn)}, {dateToTimeString(shippedOn)}<br/></>: <></>}
        </div>

        <div className="order-products">
            {order.products ? order.products.map((prod: any) => {return <Product
                prod={prod}
                key={prod.sku} 
                admin={true}
                currency={order.value.currency as Currency}
                quantityLocked={true}
            />}
            ) : <p>You don't have permission to see the products attached to this order! This is likely a mistake, contact support for help.</p>}
        </div>
        
        <form className="delivery-cost" onSubmit={setDeliveryCost}>
            <label>Royal Mail Delivery Cost: £
                <input id="delivery-cost-input" placeholder="0.00" ref={deliveryCostInput}/>
            </label>
            <input type="submit"/>
        </form>
        
        <p id="order-fulfil-warning">{
            order.fulfilled
            ? ""
            : order.dispatched  
                ? "This order has been dispatched to Royal Mail, you should mark it as fulfilled!" 
                : "This order has not yet been dispatched to Royal Mail, you should not mark this order as fulfilled unless you're certain it's been sent out."
        }</p>
        
        <button 
            className="fulfil-order" 
            onClick={toggleFulfilment} 
            disabled={toggleInProgress}
            style={{backgroundColor: order.fulfilled ? "var(--red)": (order.dispatched ? "var(--green)" : "var:(--jamie-grey)")}}
        >
            {
            toggleInProgress ? 
            <Throbber extraClass="order-throbber"/> :
            <p>{
                !order.fulfilled 
                ? order.dispatched 
                    ? <>Mark order as <b>fulfilled</b></> 
                    : <>(NOT RECOMMENDED) Force mark order as <b>fulfilled</b></>
                : <>Mark order as <b>unfulfilled</b></>  
            }</p>
            }
        </button>
    </>)
}
