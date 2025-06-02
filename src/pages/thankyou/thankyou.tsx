import { useEffect } from "react";
import ReactGA from "react-ga4"

import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./thankyou.css"
import Stripe from "stripe";

const order_confirmed_gif: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//order-confirmed.gif"

export default function ThankYou() {
    useEffect(() => {
        async function stripeWebhook(session_id: string|null) {
            if (!session_id) {
                return
            }
            const response: Response | void = await fetch(
                ".netlify/functions/fetchStripeCheckoutData", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stripeSessionId: session_id
                })
            })
            const respBody: string = await new Response(response.body).text()
            return JSON.parse(respBody)
        }
        // Clear Basket
        localStorage.removeItem("basket")
        window.dispatchEvent(new CustomEvent("basketUpdate"))

        // GA4
        const session_id = new URLSearchParams(window.location.search).get("session_id")
        stripeWebhook(session_id)
        .then(response => {
            const stripe = response.stripe
            const supabase = response.supabase
            const products: {
                image_url: string,
                line_value: number,
                product_name: string,
                quantity: number,
                sku: number
            }[] = supabase.products

            ReactGA.event("purchase", {
                transaction_id: supabase.id,
                value: supabase.total_value,
                shipping: stripe.shipping_cost.amount_total/100,
                currency: "GBP",
                items: products.map((prod) => {
                    return {
                        item_id: prod.sku,
                        item_name: prod.product_name,
                        quantity: prod.quantity,
                        price: prod.line_value/prod.quantity
                    }
                })
            })
        })

    })

    return (<><Header/><div className="content">
        <div className="thanks-box">
            <div className="thanks-top">
                <div className="order-confirmed-gif-container">
                    <img id="order-confirmed-gif" src={order_confirmed_gif}/>
                    <div id="drop-shadow"/>
                </div>
            </div>
            <div className="thanks-bottom">
                <h1>Thank You So Much!</h1>
                <p>Your order has been placed! You'll receive a confirmation email soon and your items will arrive in a few days!</p>

                <button id="go-home" onClick={goHome}>Go Home</button>
            </div>
            
        </div>
        </div><Footer/></>)
}

function goHome() {
    window.location.href = "/"
}