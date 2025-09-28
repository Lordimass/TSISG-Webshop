// NOTE: Stripe CLI will time-out the key after 90 days, so if things aren't working in
// local development, try `stripe login`!

// Also need to enable forwarding webhooks for local dev, use the following:
// stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
// This is done automatically by launch-dev-server.ps1 ^

import "./checkout.css"

import Header from "../../components/header-footer/header"
import Footer from "../../components/header-footer/footer"
import Throbber from "../../components/throbber/throbber";
import { CheckoutProducts } from "../../components/product/products";

import { LoginContext, SiteSettingsContext } from "../../app";
import { checkCanMakePayment, redirectIfEmptyBasket, validateEmail } from "./checkoutFunctions";
import { page_title } from "../../lib/consts";
import { Basket } from "../../lib/types";

import React, { useState, useEffect, FormEvent, useRef, useContext } from "react";
import {StripeCheckoutTotalSummary} from '@stripe/stripe-js';
import {AddressElement, CheckoutProvider, PaymentElement, useCheckout} from '@stripe/react-stripe-js';
import {Stripe as StripeNS} from "stripe";
import { NotificationsContext } from "../../components/notification/notification";
import { addressElementOpts, checkoutProviderOpts, paymentElementOpts, stripePromise } from "./consts";

export default function Checkout() {
    const [preparing, setPreparing] = useState(true)
    
    // If the user has nothing in their basket, they should not
    // be on this page and will be redirected home
    useEffect(redirectIfEmptyBasket, []) 
    const title = page_title + " - Checkout"
    return (<><Header/><div className="content checkout-content">
        <title>{title}</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/checkout'/>
        
        {preparing ? <Loading/> : <></>}
        
        <CheckoutProvider stripe={stripePromise} options={checkoutProviderOpts}>
            <CheckoutAux onReady={()=>{setPreparing(false)}}/>
        </CheckoutProvider>

        </div><Footer/></>);
}

function CheckoutAux({onReady}: {onReady: Function}) {
    const {notify} = useContext(NotificationsContext)
    /**
     * Checks whether all of the items in the basket are still in stock
     * @returns true if stock is OK, false if it is not.
     */
    async function checkStock() {
        // Can assume basket string exists given context
        const basket: Basket = JSON
            .parse(localStorage.getItem("basket") as string)
            .basket
        
        const response = await fetch("/.netlify/functions/checkStock", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(basket.map((prod) => {return {
                sku: prod.sku,
                basketQuantity: prod.basketQuantity,
                name: prod.name
            }}))
        })
        const body = await new Response(response.body).text()

        if (!response.ok) {
            console.error(body)
            setError(<p className="checkout-error">{body}</p>)
            return false
        } else {
            // If there were no discrepencies
            if (response.status == 204) {
                setError(<p></p>)
                return true
            }
            const discrepencies: {
                sku: number, 
                name: string,
                stock: number,
                basketQuantity: number,
            }[] = JSON.parse(body)

            const err = <><p className="checkout-error">
                <i>Too slow!</i><br/>Part of your order is now out of stock, head
                back to the <a style={{color: "white"}} href="/">home page</a> to
                change your order, then come back:<br/><br/></p>
                {
                    discrepencies.map((discrep) => <p 
                    className="checkout-error" 
                    key={discrep.sku}>
                    We have {discrep.stock} "{discrep.name}" left, you
                    tried to order {discrep.basketQuantity}
                    </p>)
                }
                </>
            
            setError(err)
            return false
        }
    }

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setIsLoading(true);
        
        console.log("Attempting to check out...")
        const error: any = await checkout.confirm();
        if (error) {
            notify(error.error.message)
        }
        setIsLoading(false);
    };

    /**
     * Checks if the session is still active, since they expire after a set time,
     * if it's not, warn the user that they should reload the page
     * @returns <code>false</code> if the session is expired, 
     * <code>true</code> if it is not
     */
    async function checkSessionStatus() {
        const response = await fetch("/.netlify/functions/getCheckoutSession", {
            method: "POST",
            body: checkout.id
        })
        const body = await new Response(response.body).text()
        if (!response.ok) {
            console.error(body)
            setError(<p className="checkout-error">{body}</p>)
        }
        const session: StripeNS.Checkout.Session = JSON.parse(body)
        if (session.status != "open") {
            setError(<p className="checkout-error">
                This session has expired! Reload the page to fix it
            </p>)
            return false;
        } else {
            setError(<p></p>)
            return true;
        }
    }

    const [debugInfo, setDebugInfo] = useState("")
    useEffect(() => {
        async function get() {
            if (loginContext.permissions.includes("debug")) {
                setDebugInfo(await checkCanMakePayment(stripePromise))
            }
        }
        get()
    }, [])

    const loginContext = useContext(LoginContext)
    const checkout = useCheckout();

    const [readyToCheckout, setReadyToCheckout] = useState(false)

    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);

    const [error, setError] = useState(<p></p>)
    const [isLoading, setIsLoading] = useState(false);

    const addressComplete = useRef(false)
    const country = useRef<string>("")

    // Handle changes in address and update shipping options
    const addressElement = checkout.getShippingAddressElement()
    addressElement?.once("change", async (e) => {
        // Don't check again unless the country has changed
        if (e.value.address.country === country.current) return
        // Don't bother checking until the full address is complete
        if (!e.complete) return
        country.current = e.value.address.country

        const resp = await fetch(window.location.origin + "/.netlify/functions/getShippingOptions", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({country: e.value.address.country, checkoutID: checkout.id})
        })
        if (!resp.ok) {
            console.error(await resp.text())
            setError(<p className="msg">Something went wrong fetching the shipping rates for your address, sorry!</p>)
            return
        }
        const rates: string[] = await resp.json()
        if (!rates || !rates.length) {setError(<p className="msg">We couldn't find any shipping rates for your address, sorry!</p>); return}
        
        // TODO: Give customers multiple shipping options
        checkout.updateShippingOption(rates[0])

        addressComplete.current = true
    })

    // To prevent overloading the database / exploitation, only check stock once.
    //
    // Theoretically, someone could type their address (and therefore check stock),
    // then someone else could place an order for the same thing, then this person
    // could place their order, and successfully order out of stock products, but
    // this is an extreme edge case that's incredibly unlikely to happen.
    const [hasCheckedStock, setHasCheckedStock] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    // Run checks to see if checkout is ready or not once fields have all been validated
    useEffect(() => {async function checkReadyToCheckout() {
        let ready = isEmailValid && addressComplete.current

        console.log("Ready to checkout: ", ready);
        if (ready) {
            // Check that the session is still active
            if (!await checkSessionStatus()) {
                ready = false
                setError(<p>"Checkout Expired! Please reload the page"</p>)
                return
            }

            // Check stock if it's not already been checked
            if (!hasCheckedStock) {
                const inStock = await checkStock();
                if (!inStock) {
                    ready = false
                    return
                }
                setHasCheckedStock(true);
            }
        }
        setReadyToCheckout(ready);

    }; checkReadyToCheckout()}, [isEmailValid, addressComplete.current])

    // Kill switch
    const siteSettings = useContext(SiteSettingsContext)
    const [killSwitch, setKillSwitch] = useState<boolean>(false)
    let killSwitchMessage
    if (killSwitch) {
        killSwitchMessage = siteSettings.kill_switch?.message
    }
    useEffect(() => {
        setKillSwitch(siteSettings.kill_switch?.enabled ?? false)
    }, [siteSettings])
    
    const DEV = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"

    return (<>
        <div className="checkout-left" id="checkout-left">
            <form id="payment-form" ref={formRef}>
                <p className="msg">
                    Shipping is currently limited to the United Kingdom. 
                    International shipping will be coming soon!
                </p><br/>

                <AddressElement options={addressElementOpts}/>

                <RequiredInput 
                    label="Email" 
                    id="email-input" 
                    setIsValid={setIsEmailValid} 
                    value={email} 
                    setValue={setEmail}
                    constraint={async (value) => validateEmail(value, checkout)}
                />

                <label>Payment</label>
                <PaymentElement 
                    id="payment-element" 
                    onReady={() => {onReady()}}
                    options={paymentElementOpts}
                />
            </form>
        </div>

        <div className="checkout-right">
            <CheckoutProducts/>
            <p className="msg">To edit your basket, <a href="/">go back</a></p>
            <CheckoutTotals checkoutTotal={checkout.total}/>
            <p className="msg">{killSwitchMessage}</p>
            <button type="button" disabled={!readyToCheckout || isLoading || (killSwitch && !DEV)} id="submit" onClick={handleSubmit}>
                <span id="button-text">
                {isLoading ? (
                    <div className="spinner" id="spinner">Processing Payment...</div>
                ) : (
                    `Place Order!`
                )}
                </span>
            </button>
            {error}
            {debugInfo ? debugInfo : ""}
        </div>
        
    </>)
}

function Loading() {
    return (<div className="loading-screen">
        
        <p>We're loading your basket...</p>
        <Throbber/>
    </div>)
}

function RequiredInput({ 
    setIsValid, 
    value,
    setValue,
    label, 
    id, 
    type, 
    placeholder, 
    constraint
}: {
    setIsValid: (isValid: boolean) => void, 
    value?: string,
    setValue: (value: string) => void,
    label?: string, 
    id?: string, 
    type?: string, 
    placeholder?: string
    constraint?: (value: string) => Promise<{isValid: boolean, message?: string}>
}) {
    async function handleBlur() {
        await update(value);
    }

    async function handleChange(e: any) {
        setValue(e.target.value)
        await update(e.target.value);
    }

    async function update(value?: string) {
        if (!value || value.length < 1) {
            setIsValid(false);
            setError("This field is required")
        } else {
            if (constraint) {
                const {isValid, message} = await constraint(value);
                if (!isValid) {
                    setIsValid(false);
                    setError(message ?? null)
                } else {
                    setIsValid(true);
                    setError(null)
                }
            } else {
                setIsValid(true);
                setError(null)
            }
        }
    }

    const [error, setError] = useState<string | null>(null);

    return (<div className={"required-input"+(error ? " invalid-required-input" : "")}>
        <label>
            {label ?? ""}<br/>
            <input
                value={value}
                id={id}
                type={type ?? "text"}
                placeholder={placeholder ?? ""}
                onBlur={handleBlur}
                onChange={handleChange}
            />
        </label>
        { error ? <p className="error msg">{error}</p> : null }
    </div>)
}

function CheckoutTotals({checkoutTotal}: {checkoutTotal: StripeCheckoutTotalSummary}) {
    const isShippingCalculated = checkoutTotal.shippingRate.minorUnitsAmount !== 0
    const sub = checkoutTotal.subtotal.amount
    const shp = checkoutTotal.shippingRate.amount
    const tot = checkoutTotal.total.amount
    return (
    <div className="checkout-totals">
        <div className="left">
            <p>Subtotal</p>
            <p>Shipping</p>
            <p className="total">Total</p>
        </div>
        <div className="spacer"></div>
        <div className="right">
            <p>{sub}</p>
            <p style={{color: isShippingCalculated ? undefined : "var(--jamie-grey)"}}>{shp}</p>
            <div className="total" style={{color: isShippingCalculated ? undefined : "var(--jamie-grey)"}}><p className="currency">GBP</p>{tot}</div>
        </div>
    </div>
    )
}
