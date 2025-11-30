import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config({path: ".env.netlify"});

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY does not exist!")
} 
export let stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-08-27.basil',
});