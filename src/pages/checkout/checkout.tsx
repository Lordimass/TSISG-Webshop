// NOTE: Stripe CLI will time-out the key after 90 days, so if things aren't working in
// local development, try `stripe login`!

// Also need to enable forwarding webhooks for local dev, use the following:
// stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
// This is done automatically by launch-dev-server.ps1 ^

import "./checkout.css"

import Header from "../../assets/components/header"
import Footer from "../../assets/components/footer"
import Throbber from "../../assets/components/throbber";
import { CheckoutProducts } from "../../assets/components/products";

import { LoginContext, SiteSettingsContext } from "../../app";
import { checkCanMakePayment, fetchClientSecret, redirectIfEmptyBasket, validateAddress, validateCity, validateEmail, validatePostalCode } from "./checkoutFunctions";
import { uk, eu, page_title, shipping_options } from "../../assets/consts";
import { Basket } from "../../lib/types";

import React, { useState, useEffect, FormEvent, useRef, useContext } from "react";
import {loadStripe, Stripe, StripeCheckoutContact, StripeCheckoutTotalSummary, StripePaymentElementOptions} from '@stripe/stripe-js';
import {CheckoutProvider, PaymentElement, useCheckout} from '@stripe/react-stripe-js';
import {Stripe as StripeNS} from "stripe";
import CountryOptgroups from "./countryOptgroups";
import { NotificationsContext } from "../../assets/components/notification";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_KEY
let stripePromise: Promise<Stripe | null> = new Promise(()=>{});
if (STRIPE_KEY) {
    stripePromise = loadStripe(STRIPE_KEY)
}

const appearance: {
  theme: "stripe" | "flat" | "night" | undefined
} = {
  theme: 'stripe',
};

const options = { fetchClientSecret, elementsOptions: { appearance } };
const paymentElementOpts: StripePaymentElementOptions = {
    fields: {
        billingDetails: {
            name: "never",
            address: {
                country: "never",
                line1: "never",
                postalCode: "never",
                city: "never"
            }
        }
    }
}

export default function Checkout() {
    const [preparing, setPreparing] = useState(true)
    
    // If the user has nothing in their basket, they should not
    // be on this page and will be redirected home
    useEffect(redirectIfEmptyBasket, []) 

    return (<><Header/><div className="content checkout-content">
        <title>{page_title} - Checkout</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/checkout'/>
        
        {preparing ? <Loading/> : <></>}
        
        <CheckoutProvider stripe={stripePromise} options={options}>
            <CheckoutAux onReady={()=>{setPreparing(false)}}/>
        </CheckoutProvider>

        </div><Footer/></>);
}

function CheckoutAux({onReady}: {onReady: Function}) {
    const {notify} = useContext(NotificationsContext)
    
    async function updateCountry() {
        if (!countryInput.current) return
        const code = countryInput.current.value
        
        const zones: Array<Array<string>> = [uk, eu]
        // Default shipping rate is most expensive (Should be world shipping)
        var shipping_option: {shipping_rate: string} = shipping_options[shipping_options.length-1]; 
    
        // Find the zone that the given country is in
        var found = false;
        zones.forEach((zone, i) => {
            if (zone.includes(code)) {
                shipping_option = shipping_options[i];
                found = true;
                return
            }
        })
    
        // Apply the shipping rate
        checkout.updateShippingOption(shipping_option.shipping_rate);
        setCountryCode(code)
    }

    function CountrySelect() {
        return(<>
        <label>Country</label><br/>
        <select 
            ref={countryInput}
            name="country" 
            className="form-control" 
            id="country-select" 
            onChange={updateCountry} 
            defaultValue={countryCode}
        >
            <CountryOptgroups/>
        </select>
        <p className="msg">
            Shipping is currently limited to the United Kingdom. 
            International shipping will be coming soon!
        </p>
        </>)
    }

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

    const countryInput = useRef<HTMLSelectElement>(null)
    const [countryCode, setCountryCode] = useState("0")

    const [readyToCheckout, setReadyToCheckout] = useState(false)
    
    const [name, setName] = useState('');
    const [isNameValid, setIsNameValid] = useState(false);

    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);

    const [address, setAddress] = useState<string | undefined>(undefined);
    const [isAddressValid, setIsAddressValid] = useState(false);

    const [city, setCity] = useState<string | undefined>(undefined);
    const [isCityValid, setIsCityValid] = useState(false);

    const [postalCode, setPostalCode] = useState<string | undefined>(undefined);
    const [isPostalCodeValid, setIsPostalCodeValid] = useState(false);

    const [error, setError] = useState(<p></p>)
    const [isLoading, setIsLoading] = useState(false);

    // To prevent overloading the database / exploitation, only check stock once
    // Theoretically, someone could type their address (and therefore check stock),
    // then someone else could place an order for the same thing, then this person
    // could place their order, and successfully order out of stock products, but
    // this is an extreme edge case that's incredibly unlikely to happen.
    const [hasCheckedStock, setHasCheckedStock] = useState(false);

    const formRef = useRef<HTMLFormElement>(null);

    // Run checks to see if checkout is ready or not once fields have all been validated
    useEffect(() => {async function checkReadyToCheckout() {
        let ready = isNameValid 
        && isEmailValid 
        && isAddressValid 
        && isCityValid 
        && isPostalCodeValid
        && countryCode != "0";
        console.log("Ready to checkout: ", ready);
        if (ready) {
            // Update billing addresses
            const compiledAddress: StripeCheckoutContact = {
                name: name,
                address: {
                    country: countryCode,
                    line1: address,
                    city: city,
                    postal_code: postalCode,
                }
            }
            await checkout.updateShippingAddress(compiledAddress);
            await checkout.updateBillingAddress(compiledAddress);

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

    }; checkReadyToCheckout()}, [isNameValid, isEmailValid, isAddressValid, isCityValid, isPostalCodeValid, countryCode])

    // Kill switch
    const siteSettings = useContext(SiteSettingsContext)
    const [killSwitch, setKillSwitch] = useState<boolean>(false)
    let killSwitchMessage = null
    if (killSwitch) {
        killSwitchMessage = siteSettings.kill_switch.message
    }
    useEffect(() => {
        setKillSwitch(siteSettings.kill_switch && siteSettings.kill_switch.enabled )
    }, [siteSettings])
    
    // Set shipping rate to first option as default until country is set.
    useEffect(() => {checkout.updateShippingOption(shipping_options[0].shipping_rate)}, [])
    const DEV = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"



    return (<>
        <div className="checkout-left" id="checkout-left">
            <form id="payment-form" ref={formRef}>
                <RequiredInput 
                    label="Name" 
                    id="name-input" 
                    setIsValid={setIsNameValid} 
                    value={name} setValue={setName}
                />
                <RequiredInput 
                    label="Email" 
                    id="email-input" 
                    setIsValid={setIsEmailValid} 
                    value={email} 
                    setValue={setEmail}
                    constraint={async (value) => validateEmail(value, checkout)}
                />
                <RequiredInput 
                    label="Address" 
                    id="address-input" 
                    setIsValid={setIsAddressValid} 
                    value={address} setValue={setAddress}
                    constraint={validateAddress}
                />
                <RequiredInput 
                    label="City" 
                    id="city-input" 
                    setIsValid={setIsCityValid} 
                    value={city} 
                    setValue={setCity}
                    constraint={validateCity}
                />
                <RequiredInput 
                    label="Postcode / ZIP Code" 
                    id="postal-code-input" 
                    setIsValid={setIsPostalCodeValid} 
                    value={postalCode} 
                    setValue={setPostalCode}
                    constraint={validatePostalCode}
                />

                <CountrySelect/><br/><br/>
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

    return (<>
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
        <br/>
    </>)
}

function CheckoutTotals({checkoutTotal}: {checkoutTotal: StripeCheckoutTotalSummary}) {
    return (
    <div className="checkout-totals">
        <div className="left">
            <p>Subtotal</p>
            <p>Shipping</p>
            <p className="total">Total</p>
        </div>
        <div className="spacer"></div>
        <div className="right">
            <p>{checkoutTotal.subtotal.amount}</p>
            <p>{checkoutTotal.shippingRate.amount}</p>
            <div className="total"><p className="currency">GBP</p>{checkoutTotal.total.amount}</div>
        </div>
    </div>
    )
}
