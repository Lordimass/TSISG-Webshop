import { useEffect } from "react";
import ReactGA from "react-ga4"

import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./thankyou.css"
import { fetchFromNetlifyFunction } from "../../assets/utils";

const order_confirmed_gif: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//order-confirmed.gif"

type StripeProduct = {
    image_url: string,
    line_value: number,
    product_name: string,
    quantity: number,
    sku: number,
    category: {id: number, name: string} 
}

export default function ThankYou() {
    // GA4 Tracking
    const session_id = new URLSearchParams(window.location.search).get("session_id")
    const response = fetchFromNetlifyFunction(
        "fetchStripeCheckoutData", 
        JSON.stringify({stripeSessionId: session_id})
    )
    if (!Array.isArray(response) && response.stripe && response.supabase) {
        const stripe = response.stripe
        const supabase = response.supabase
        const products: StripeProduct[] = supabase.products

        const amount_shipping = stripe.total_details.amount_shipping/100
        const amount_tax = stripe.total_details.amount_tax/100

        ReactGA.event("purchase", {
            transaction_id: supabase.id,
            value: supabase.total_value-amount_shipping,
            shipping: amount_shipping,
            tax: amount_tax,
            currency: "GBP",
            items: products.map((prod) => {
                return {
                    item_id: prod.sku,
                    item_name: prod.product_name,
                    quantity: prod.quantity,
                    price: prod.line_value/prod.quantity,
                    item_category: prod.category.name
                }
            })
        })
    }

    // Handle cases where not all of the data was available for the order
    //
    // (Also handles basket clearing after these checks to ensure the basket isn't attempting to
    // rerender simultaneously to the page)
    useEffect(()=>{
        if (!Array.isArray(response) && !response.stripe) {
            console.warn(`Failed to log checkout to GA4 since the session doesn't exist in Stripe.`)
        } else if (!Array.isArray(response) && !response.supabase) {
            console.warn(`Failed to log checkout to GA4 since the order doesn't exist on Supabase.`)
        } else if (!Array.isArray(response)) {
            // Clear Basket
            localStorage.removeItem("basket")
            window.dispatchEvent(new CustomEvent("basketUpdate"))
        }
    }, [response])

    return (<><Header/><div className="content">
        <title>Thank you for your order!</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/thankyou'/>

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