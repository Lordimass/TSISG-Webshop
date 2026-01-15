import {loadStripe, Stripe, StripeAddressElementOptions, StripePaymentElementOptions} from "@stripe/stripe-js";
import {createCheckoutSession} from "./checkoutFunctions.ts";

const STRIPE_KEY = import.meta.env.VITE_STRIPE_KEY
if (!STRIPE_KEY) {
    console.error("No VITE_STRIPE_KEY!")
}
export const stripePromise: Promise<Stripe | null> = STRIPE_KEY ? loadStripe(
    STRIPE_KEY
) : new Promise(() => {
});

export const appearance: any = {
    theme: 'flat',
    variables: {
        fontFamily: '"Perfect Penmanship", cursive',
        colorBackground: "#ffffff",
        borderRadius: "1em"
    },
    rules: {
        ".Input": {
            borderColor: "#838383",
            borderWidth: "2px",
            marginBottom: "6px",
            borderStyle: "solid",
            fontSize: "16px",
            padding: "10px",
            lineHeight: "1em"
        },
        ".Label": {
            fontFamily: '"Perfect Penmanship", cursive',
            fontWeight: 400,
            fontSize: "14px"
        },
        ".Error": {
            marginBottom: "6px"
        }
    }
};

export const checkoutProviderOpts = {
    fetchClientSecret: createCheckoutSession,
    elementsOptions: {
        appearance,
        fonts: [{
            cssSrc: "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/PerfectPenmanship.css"
        }]
    },
    adaptivePricing: {allowed: true},
};

export const paymentElementOpts: StripePaymentElementOptions = {
    // fields: {
    //     billingDetails: {
    //         name: "auto",
    //         address: {
    //             country: "auto",
    //             line1: "auto",
    //             postalCode: "auto",
    //             city: "auto"
    //         }
    //     }
    // }
}

export const addressElementOpts: StripeAddressElementOptions = {
    mode: "shipping"
} 