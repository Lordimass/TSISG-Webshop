// NOTE: Stripe CLI will time out the key after 90 days, so if things aren't working in
// local development, try `stripe login`!

// Also need to enable forwarding webhooks for local dev, use the following:
// stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
// This is done automatically by launch-dev-server.ps1

import "./checkout.css"

import {SiteSettingsContext} from "../../app";
import {checkStock, createCheckoutSession, redirectIfEmptyBasket, updateShippingOptions} from "./checkoutFunctions.ts";
import {page_title} from "../../lib/consts.ts";
import React, {useContext, useEffect, useState} from "react";
import {EmbeddedCheckout, EmbeddedCheckoutProvider} from '@stripe/react-stripe-js';
import {stripePromise} from "./consts.ts";
import {NotificationsContext} from "../../components/notification/lib";
import {triggerBeginCheckout} from "../../lib/analytics/analytics";
import Page from "../../components/page/page";
import {LocaleContext} from "../../localeHandler.ts";

export default function Checkout() {
    // If the user has nothing in their basket, they should not
    // be on this page and will be redirected home
    useEffect(redirectIfEmptyBasket, [])

    useEffect(() => {
        /**
         * Checks whether all the items in the basket are still in stock
         * @returns true if stock is OK, false if it is not.
         */
        async function checkProductStock() {
            const discrepancies = await checkStock();

            // If there were no discrepancies
            if (discrepancies.length === 0) {
                if (!canCheckout) setCanCheckout(true)
                return true
            }

            let err = "Too slow! Part of your order is now out of stock, head back to the home page to change your order, " +
                "then come back:\n"
            discrepancies.forEach((discrep) => {
                err += `We have ${discrep.stock} \"${discrep.name}\" left, you tried to order ${discrep.basketQuantity}`
            })
            notify(err)
            if (canCheckout) setCanCheckout(false)
            return false
        }
        checkProductStock().then()
    }, []);

    const {notify} = useContext(NotificationsContext)
    const {currency} = useContext(LocaleContext)
    const [canCheckout, setCanCheckout] = useState<boolean>(false)
    const siteSettings = useContext(SiteSettingsContext)

    useEffect(() => {
        triggerBeginCheckout(undefined, currency).then();
    }, []);

    const title = page_title + " - Checkout"
    return (<Page
        id="checkout-content"
        noindex={true}
        canonical="https://thisshopissogay.com/checkout"
        title={title}
        loadCondition={canCheckout && !siteSettings.kill_switch?.enabled}
        loadingText="We're loading your basket..."
    >
        {canCheckout && !siteSettings.kill_switch?.enabled ? <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{
                fetchClientSecret: createCheckoutSession,
                onShippingDetailsChange: async (e) => {
                    console.log("Checkout Session Data:", JSON.stringify(e));
                    const resp = await updateShippingOptions(e.checkoutSessionId, e.shippingDetails)
                    if (resp.ok) {
                        return {type: "accept"}
                    } else {
                        return {type: "reject", errorMessage: await resp.text() || "Something went wrong, please contact us for help!"}
                    }
                }
            }}
        >
                <CheckoutAux/>
            </EmbeddedCheckoutProvider> : null}
    </Page>)
}

function CheckoutAux() {
    // checkout.getShippingAddressElement()?.on("change", async (e: StripeAddressElementChangeEvent) => {
    //     console.log("Shipping details changed!")
    //     const address = e.shippingDetails.address
    //     if (!address.line1 || !address.city || !address.state || !address.postal_code) {
    //         return
    //     }
    //     await updateShippingOptions(e.checkoutSessionId, e.shippingDetails)
    // })
    // TODO: Charge separate prices based on address
    return <EmbeddedCheckout className={"embedded-checkout"}/>;
}