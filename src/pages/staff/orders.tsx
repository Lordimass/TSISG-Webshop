import { useContext, useEffect, useRef, useState } from "react";
import { dateToDateString, dateToTimeString, getJWTToken, getOrderList } from "../../assets/utils";
import { CheckoutProduct } from "../../assets/components/product";
import Throbber from "../../assets/components/throbber";

import "./css/orders.css"
import { LoginContext, NotificationsContext } from "../../app";
import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";

const overdue_threshold: number = 7;

type Order = {
    id: number
    placed_at: string
    email: string
    street_address: string
    postal_code: string
    country: string
    name: string
    fulfilled: boolean
    total_value: number
    dispatched: boolean
    delivery_cost?: number
    products: {
        sku: number,
        product_name: string,
        quantity: number,
        line_value: number,
        image_url: string
    }[]
    royalMailData: {
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

}

export function OrderManager() {
    const loginContext = useContext(LoginContext)
    const [accessible, setAccessible] = useState(false)

    useEffect(() => {
        setAccessible(loginContext.permissions.includes("manage_orders"))
    }, [loginContext]) 

    let orders: Order[] = getOrderList(getJWTToken())
    orders.sort(compareOrders)
    return (<><Header/><div className="content" id="order-manager-content">
        <title>TSISG STAFF - Order Manager</title>
        <meta name="robots" content="noindex"/>

        {
            accessible ? 
            orders ? (orders.map((order: any) => <Order key={order.id} order={order}/>)) : <></> 
            : <NotLoggedIn/>
        }
        </div><Footer/></>)
}

function Order({order}:{order:Order}) {
    function expand() {
        setExpanded(!expanded)
    }

    async function toggleFulfilment() {
        if (toggleInProgress) {
            return
        }
        
        setToggleInProgress(true);

        // Extract delivery cost
        const deliveryCostString = deliveryCostInput.current ? deliveryCostInput.current.value : null
        let deliveryCost = null
        if (deliveryCostString) {
            const potentialDeliveryCost = parseFloat(deliveryCostString)
            if (!Number.isNaN(potentialDeliveryCost)) {
                deliveryCost = potentialDeliveryCost
            } else {
                notify("Invalid delivery cost supplied! \"" + deliveryCostString + `"`)
                setToggleInProgress(false);
                return;
            }
        }
    
        const response = await fetch("../.netlify/functions/toggleOrderFulfilment", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${await getJWTToken()}`
            },
            body: JSON.stringify({id: order.id, delivery_cost: deliveryCost})
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

    const {notify} = useContext(NotificationsContext)

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
            {order.products ? order.products.map(prod => <CheckoutProduct 
                image={prod.image_url}
                name={prod.product_name}
                quantity={prod.quantity}
                total={prod.line_value}
                sku={prod.sku}
                key={prod.sku}
            />) : <p>You don't have permission to see the products attached to this order! This is likely a mistake, contact support for help.</p>}
        </div>
        {!order.fulfilled
        ? <div className="delivery-cost">
            <p>Royal Mail Delivery Cost: £</p>
            <input placeholder="0.00" ref={deliveryCostInput}/>
            <p>(Mark order as fulfilled to save)</p>
            </div>
        : <></>}
        
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

function compareOrders(a:Order, b:Order) {
    const dateA = new Date(a.placed_at)
    const dateB = new Date(b.placed_at)
    // Place fulfilled orders after unfulfilled orders
    if (a.fulfilled && !b.fulfilled) {
        return 1
    } else if (b.fulfilled && !a.fulfilled) {
        return -1
    // Place oldest unfullfilled orders first
    } else if (!a.fulfilled && !b.fulfilled) {
        return dateA < dateB 
        ? -1 
        : dateA == dateB
            ? 0 
            : 1
    // Place most recent fulfilled orders first
    } else {
        return dateA < dateB 
        ? 1 
        : dateA == dateB 
            ? 0
            : -1
    }
}