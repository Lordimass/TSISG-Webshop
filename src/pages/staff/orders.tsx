import { useContext, useEffect, useRef, useState } from "react";
import "./css/orders.css"
import { CheckoutProduct } from "../../components/product/product";
import Throbber from "../../components/throbber/throbber";

import "./css/orders.css"
import { LoginContext } from "../../app";
import Header from "../../components/header-footer/header";
import Footer from "../../components/header-footer/footer";
import { useGetOrderList } from "../../lib/netlifyFunctions";
import { Order } from "../../lib/types";
import { compareOrders } from "../../lib/sortMethods";
import { overdue_threshold } from "../../lib/consts";
import { callRPC } from "../../lib/supabaseRPC";
import { OrdersContext } from "./lib";
import { getJWTToken } from "../../lib/auth";
import { dateToDateString, dateToTimeString } from "../../lib/lib";
import { NotificationsContext } from "../../components/notification/lib";

export function OrderManager() { 
    const unsetOrders: Order[] = useGetOrderList() || []
    const [orders, setOrders] = useState<Order[]>([])
    useEffect(() => {
        if (unsetOrders.length > 0) setOrders(unsetOrders)
    }, [unsetOrders])

    orders.sort(compareOrders)
    const loginContext = useContext(LoginContext)
    const [accessible, setAccessible] = useState(false)
    useEffect(() => {
        setAccessible(loginContext.permissions.includes("manage_orders"))
    }, [loginContext]) 

    return (<><Header/><div className="content" id="order-manager-content">
        <OrdersContext.Provider value={{orders, setOrders}}>
        <title>TSISG STAFF - Order Manager</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/staff/orders'/>

        {
            accessible ? 
            orders ? (orders.map((order: any) => <OrderDisplay key={order.id} order={order}/>)) : <></> 
            : <NotLoggedIn/>
        }
        </OrdersContext.Provider></div><Footer/></>)
}

function OrderDisplay({order}:{order:Order}) {
    function expand() {
        setExpanded(!expanded)
    }

    async function toggleFulfilment() {
        if (toggleInProgress) return
        setToggleInProgress(true);
    
        const response = await fetch("../.netlify/functions/toggleOrderFulfilment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getJWTToken()}`
            },
            body: JSON.stringify({id: order.id})
        })

        if (response.ok) {
            order.fulfilled = !order.fulfilled
            setColourClass(getColourClass())
        } else {
            const respText = await response.text()
            console.error(respText)
            notify(respText)
        }
        setToggleInProgress(false);  
    }

    function getColourClass() {
        const newColourClass = order.fulfilled ?
        "fulfilled-order" : timeDifference > overdue_threshold ?
        "overdue-order" :
        "unfulfilled-order"
        return newColourClass
    }

    async function setDeliveryCost(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        // Update Supabase
        const val = deliveryCostInput.current?.value ?? "s"
        if (+val <= 0) {notify("Cost must be a valid number greater than 0!"); return}
        try {
            await callRPC("update_delivery_cost", {order_id: order.id, new_cost: val}, notify)
        } catch {return}

        // Update the order state
        const newOrders = orders.map(o => {
            if (o.id !== order.id) return o
            else return {...o, delivery_cost: +val}
        })
        setOrders!(newOrders)
    }

    const {notify} = useContext(NotificationsContext)
    const {orders, setOrders} = useContext(OrdersContext)

    const date = new Date(order.placed_at)
    const today = new Date()
    const timeDifference = Math.floor((today.getTime() - date.getTime())/(86400000));
    const dateString = dateToDateString(date)
    const timeString = dateToTimeString(date)

    const [colourClass, setColourClass] = useState(getColourClass())
    const [expanded, setExpanded] = useState(false);
    const [toggleInProgress, setToggleInProgress] = useState(false)
    const deliveryCostInput = useRef<HTMLInputElement | null>(null)

    const shippedOn = order.dispatched ? new Date(order.royalMailData.shippedOn!) : new Date()

    return (<><div className="order">

    <div className={"order-main " + colourClass} id={"order-main-"+order.id}>
        <p className="order-id">ID: {order.id}</p>
        <p> 
            Order for {order.name}:
            {" " + dateString}.<br/>
            {order.fulfilled ? <b> FULFILLED</b> :
            timeDifference > overdue_threshold ? <b>OVERDUE BY {timeDifference-overdue_threshold} DAYS</b> :
            <b> UNFULFILLED {order.dispatched ? " | Package handed to Royal Mail, Mark As Fulfilled." : ""}</b>
            }
        </p>
        <p className="expand-order" onClick={expand}>{expanded?"collapse":"expand"}</p>
    </div>

    <div className="order-details" style={{display: expanded?"flex":"none"}}>
        <div className="order-values">
            Short ID: {order.id.toString().slice(0,40)} <br/>
            {order.royalMailData ? <>Royal Mail ID: {order.royalMailData.orderIdentifier}<br/></> : <></>}
            Name: {order.name}<br/>
            Email: {order.email}<br/>
            Placed at: {dateString}, {timeString}<br/>
            Street Address: {order.street_address}<br/>
            Postal Code: {order.postal_code}<br/>
            Country: {order.country}<br/>
            Total Value: £{order.total_value.toFixed(2)}<br/>
            {order.delivery_cost ? <>Royal Mail Delivery Cost: £{order.delivery_cost.toFixed(2)}<br/></> : <></>}
            {order.dispatched ? <>Dispatched: {dateToDateString(shippedOn)}, {dateToTimeString(shippedOn)}<br/></>: <></>}
        </div>

        <div className="order-products">
            {order.products ? order.products.map(prod => {return <CheckoutProduct 
                product={prod} 
                key={prod.sku} 
                admin={true} 
                checkbox={true}
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

        <p className="expand-order" onClick={expand}><br/>collapse</p>
    </div>
    </div></>)
}

function NotLoggedIn() {
    return (
        <div className="login-box">
            <p style={{textAlign: "center"}}>
                You're not logged in to an account with access to this page.
                If you believe this is a mistake, first, <a href="/login">check that you're logged in</a>.
                Failing this, contact support and we can help you out!
            </p>
        </div>
    )
}
