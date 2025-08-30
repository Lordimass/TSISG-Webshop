import { useEffect, useRef } from "react";
import ReactGA from "react-ga4"

import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./thankyou.css"
import { fetchFromNetlifyFunction } from "../../assets/utils";
import { getGAClientId, getGAClientIdGtag, getGASessionId } from "../../lib/analytics";

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
    // Clear basket on load.
    useEffect(()=>{
        localStorage.removeItem("basket")
        window.dispatchEvent(new CustomEvent("basketUpdate"))
    }, [])

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