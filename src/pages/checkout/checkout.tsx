// NOTE: Stripe CLI will time out the key after 90 days, so if things aren't working in
// local development, try `stripe login`!

// Also need to enable forwarding webhooks for local dev, use the following:
// stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
// This is done automatically by launch-dev-server.ps1 ^

import "./checkout.css"

import Throbber from "../../components/throbber/throbber";
import { CheckoutProducts } from "../../components/product/products";

import { LoginContext, SiteSettingsContext } from "../../app";
import {checkStock, redirectIfEmptyBasket, validateEmail} from "./checkoutFunctions.ts";
import { page_title } from "../../lib/consts.ts";
import React, { useState, useEffect, FormEvent, useRef, useContext } from "react";
import {StripeCheckoutTotalSummary} from '@stripe/stripe-js';
import {
    AddressElement,
    CheckoutProvider,
    CurrencySelectorElement,
    PaymentElement,
    useCheckout
} from '@stripe/react-stripe-js';
import {Stripe as StripeNS} from "stripe";
import { addressElementOpts, checkoutProviderOpts, paymentElementOpts, stripePromise } from "./consts.ts";
import { NotificationsContext } from "../../components/notification/lib";
import { triggerAddPaymentInfo, triggerAddShippingInfo, triggerBeginCheckout } from "../../lib/analytics/analytics";
import Page from "../../components/page/page";
import {DEFAULT_CURRENCY, LocaleContext} from "../../localeHandler.ts";
import DineroFactory, {Currency, Dinero} from "dinero.js";
import Price from "../../components/price/price.tsx";
import {convertDinero} from "@shared/functions/price.ts";
import {getPath} from "../../lib/paths.ts";
import {CURRENCY_SYMBOLS} from "@shared/consts/currencySymbols.ts";
import {getBasketProducts} from "../../lib/lib.tsx";

export default function Checkout() {
    const {currency} = useContext(LocaleContext)

    const [preparing, setPreparing] = useState(true)
    
    // If the user has nothing in their basket, they should not
    // be on this page and will be redirected home
    useEffect(redirectIfEmptyBasket, []) 
    const title = page_title + " - Checkout"
    return (<Page
        id="checkout-content"
        noindex={true}
        canonical="https://thisshopissogay.com/checkout"
        title={title}
        loadCondition={!preparing}
        loadingText="We're loading your basket..."
    >
        <CheckoutProvider stripe={stripePromise} options={checkoutProviderOpts}>
            <CheckoutAux onReady={async ()=>{
                setPreparing(false);
                await triggerBeginCheckout(undefined, currency);
            }}/>
        </CheckoutProvider>
    </Page>)
}

function CheckoutAux({onReady}: {onReady: Function}) {
    const {notify} = useContext(NotificationsContext)
    const {currency} = useContext(LocaleContext)
    /**
     * Checks whether all the items in the basket are still in stock
     * @returns true if stock is OK, false if it is not.
     */
    async function checkProductStock() {
        const discrepencies = await checkStock();

        // If there were no discrepencies
        if (discrepencies.length === 0) {
            setError(<p></p>)
            return true
        }

        const err = <><p className="checkout-error">
            <i>Too slow!</i><br/>Part of your order is now out of stock, head back to
            the <a style={{color: "white"}} href={getPath("HOME")}>home page</a> to change your order, then come
            back:<br/><br/></p>
            {
                discrepencies.map((discrep) =>
                    <p className="checkout-error" key={discrep.sku}>
                        We have {discrep.stock} "{discrep.name}" left, you
                        tried to order {discrep.basketQuantity}
                    </p>)
            }
            </>

        setError(err)
        return false
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
    }

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

    const checkout = useCheckout();

    const [readyToCheckout, setReadyToCheckout] = useState(false)

    const [email, setEmail] = useState('');
    const [isEmailValid, setIsEmailValid] = useState(false);

    const [error, setError] = useState(<p></p>)
    const [isLoading, setIsLoading] = useState(false);

    const [addressComplete, setAddressComplete] = useState(false);
    const countryChanged = useRef(true);
    const paymentInfoComplete = useRef(false)
    const country = useRef<string>("")

    // Handle changes in address and update shipping options
    const addressElement = checkout.getShippingAddressElement()
    addressElement?.once("change", async (e) => {
        countryChanged.current = (e.value.address.country !== country.current) || countryChanged.current
        country.current = e.value.address.country

        // Don't bother checking until the full address is complete
        if (!e.complete) {
            setAddressComplete(false);
            return;
        }

        // Don't check again unless the country has changed since last check
        if (!countryChanged.current) return;
        setAddressComplete(false);

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
        countryChanged.current = false;
        await checkout.updateShippingOption(rates[0])
        setAddressComplete(true)
        await triggerAddShippingInfo(currency)
    })

    const paymentElement = checkout.getPaymentElement()
    paymentElement?.once("change", async (e) => {
        if (e.complete && !paymentInfoComplete.current) {
            paymentInfoComplete.current = true
            await triggerAddPaymentInfo(currency)
        }
        
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
        let ready = isEmailValid && addressComplete

        console.log("Ready to checkout: ", ready);
        if (ready) {
            // Check that the session is still active
            if (!await checkSessionStatus()) {
                ready = false
                setError(<p>"Checkout Expired! Please reload the page"</p>)
            }

            // Check stock if it's not already been checked
            else if (!hasCheckedStock) {
                const inStock = await checkProductStock();
                if (!inStock) {
                    ready = false
                }
                setHasCheckedStock(true);
            }
        }
        setReadyToCheckout(ready);

    } checkReadyToCheckout()}, [isEmailValid, addressComplete])

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
                <AddressElement 
                    options={addressElementOpts}
                />

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
            <CheckoutProducts currency={checkout.currency as Currency} />
            <p className="msg">To edit your basket, <a href={getPath("HOME")}>go back</a></p>
            <CheckoutTotals checkoutTotal={checkout.total} currency={checkout.currency as Currency} />
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
            <CurrencySelectorElement />
        </div>
        
    </>)
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

function CheckoutTotals({checkoutTotal, currency}: {checkoutTotal: StripeCheckoutTotalSummary, currency: Currency}) {
    // Calculate total before 4% conversion rate fee
    const [preFeeTotal, setPreFeeTotal] = useState<Dinero>(DineroFactory({amount: 0, currency}))
    const precision = CURRENCY_SYMBOLS[currency.toUpperCase() as keyof typeof CURRENCY_SYMBOLS].precision;
    useEffect(() => {
        async function getPreFeeTotal() {
            let basketTotal = 0;
            for (const p of getBasketProducts()) {
                const din = DineroFactory({amount: Math.round(p.price * p.basketQuantity * 100), currency: DEFAULT_CURRENCY});
                const convDin = await convertDinero(din, currency);
                basketTotal += convDin.getAmount();
            }
            setPreFeeTotal(DineroFactory({amount: basketTotal, currency, precision}))
        }
        getPreFeeTotal();
    }, [checkoutTotal]);

    // Get Stripe's calculated prices
    const isShippingCalculated = checkoutTotal.shippingRate.minorUnitsAmount !== 0
    const fee = DineroFactory({
        amount: checkoutTotal.subtotal.minorUnitsAmount-preFeeTotal.getAmount(), currency, precision
    })
    const shp = DineroFactory({
        amount: checkoutTotal.shippingRate.minorUnitsAmount, currency, precision
    })
    const tot = DineroFactory({
        amount: checkoutTotal.total.minorUnitsAmount, currency, precision
    });
    return (
    <div className="checkout-totals">
        <div className="left">
            <p>Subtotal</p>
            {fee.getAmount()==0 ? null : <p>Conversion Fee</p>}
            <p>Shipping</p>
            <p className="total">Total</p>
        </div>
        <div className="spacer"></div>
        <div className="right">
            <Price baseDinero={preFeeTotal} currency={currency} simple />
            {fee.getAmount()==0 ? null : <Price baseDinero={fee} currency={currency} simple />}
            <div className="total" style={{color: isShippingCalculated ? undefined : "var(--jamie-grey)"}}>
                <Price baseDinero={shp} currency={currency} simple />
            </div>
            <div className="total" style={{color: isShippingCalculated ? undefined : "var(--jamie-grey)"}}>
                <Price baseDinero={tot} currency={currency} />
            </div>
        </div>
    </div>
    )
}
