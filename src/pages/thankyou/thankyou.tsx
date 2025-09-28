import { useEffect } from "react";

import Footer from "../../components/header-footer/footer";
import Header from "../../components/header-footer/header";

import "./thankyou.css"

const order_confirmed_gif: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//order-confirmed.gif"

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