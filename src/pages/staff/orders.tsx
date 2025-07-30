import { useContext, useEffect, useState } from "react";
import { getJWTToken, getOrderList } from "../../assets/utils";
import { daysOfWeek, monthsOfYear } from "../../assets/consts";
import { CheckoutProduct } from "../../assets/components/product";
import Throbber from "../../assets/components/throbber";

import "./css/orders.css"
import { LoginContext } from "../../app";
import Header from "../../assets/components/header";
import Footer from "../../assets/components/footer";

const overdue_threshold: number = 7;

type order = {
    id: number,
    placed_at: string,
    email: string,
    street_address: string,
    postal_code: string,
    country: string,
    name: string,
    fulfilled: boolean,
    total_value: number
    products: {
        sku: number,
        product_name: string,
        quantity: number,
        line_value: number,
        image_url: string
    }[]
}

export function OrderManager() {
    const loginContext = useContext(LoginContext)
    const [accessible, setAccessible] = useState(false)

    useEffect(() => {
        setAccessible(loginContext.permissions.includes("manage_orders"))
    }, [loginContext]) 

    let orders: order[] = getOrderList(getJWTToken())
    orders.sort(compareOrders)
    return (<><Header/><div className="content" id="order-manager-content">
        {
            accessible ? 
            orders ? (orders.map((order: any) => <Order key={order.id} order={order}/>)) : <></> 
            : <NotLoggedIn/>
        }
        </div><Footer/></>)
}

function Order({order}:{order:order}) {
    function expand() {
        setExpanded(!expanded)
    }

    function toggleFulfilment() {
        if (toggleInProgress) {
            return
        }
        
        async function tog() {
            setToggleInProgress(true);
            const response = await fetch(".netlify/functions/toggleOrderFulfilment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({id: order.id})
            })
            setToggleInProgress(false);
            return response;
        }
        tog().then(
            (response) => {
                order.fulfilled = !order.fulfilled
                setColourClass(getColourClass())
            },
            (error) => {console.error(error)} 
        )
        
    }

    function getColourClass() {
        const newColourClass = order.fulfilled ?
        "fulfilled-order" : timeDifference > overdue_threshold ?
        "overdue-order" :
        "unfulfilled-order"
        return newColourClass
    }

    const date = new Date(order.placed_at)
    const today = new Date()
    const timeDifference = Math.floor((today.getTime() - date.getTime())/(86400000));
    const dateString = 
    daysOfWeek[date.getDay()] +
    " " + date.getDate() +
    " " + monthsOfYear[date.getMonth()] + 
    " " + date.getFullYear();

    const [colourClass, setColourClass] = useState(getColourClass())
    const [expanded, setExpanded] = useState(false);
    const [toggleInProgress, setToggleInProgress] = useState(false)

    return (<><div className="order">

    <div className={"order-main " + colourClass} id={"order-main-"+order.id}>
        <p className="order-id">ID: {order.id}</p>
        <p> 
            Order for {order.name}:
            {" " + dateString}.<br/>
            {order.fulfilled ? <b> FULFILLED</b> :
            timeDifference > overdue_threshold ? <b>OVERDUE BY {timeDifference-overdue_threshold} DAYS</b> :
            <b> UNFULFILLED</b>
            }
        </p>
        <p className="expand-order" onClick={expand}>{expanded?"collapse":"expand"}</p>
    </div>

    <div className="order-details" style={{display: expanded?"flex":"none"}}>
        <div className="order-values">
            ID: {order.id} <br/>
            Name: {order.name}<br/>
            Email: {order.email}<br/>
            Date Placed: {dateString}<br/>
            Time Placed: {date.getHours()}:{date.getMinutes()}:{date.getSeconds()}<br/>
            Street Address: {order.street_address}<br/>
            Postal Code: {order.postal_code}<br/>
            Country: {order.country}<br/>
            Total Value: £{order.total_value}<br/>
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
        
        <p id="order-fulfil-warning">Orders are only fulfilled once they have been dispatched!</p>
        <button className="fulfil-order" onClick={toggleFulfilment} disabled={toggleInProgress}>
            {
            toggleInProgress ? 
            <Throbber extraClass="order-throbber"/> :
            <p>Mark order as <b>{order.fulfilled ? "unfulfilled" : "fulfilled"}</b></p>
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

function compareOrders(a:order, b:order) {
    const dateA = new Date(a.placed_at)
    const dateB = new Date(b.placed_at)
    if (a.fulfilled && !b.fulfilled) {
        return 1
    } else if (b.fulfilled && !a.fulfilled) {
        return -1
    } else {
        return dateA < dateB ?
        -1 :
        dateA == dateB ?
        0 :
        1
    }
}