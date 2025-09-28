import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from './pages/home/home';
import React, { createContext, useEffect, useRef, useState } from 'react'
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Page404 from './pages/404/404';
import { getUser } from './assets/utils';
import Policy from './pages/policies/policies';
import { OrderManager } from './pages/staff/orders';
import ProdPage from "./pages/products/prodPage";
import { createClient, User } from '@supabase/supabase-js';
import { refreshBasket } from './lib/lib';
import { Notif, NotificationsContext } from './assets/components/notification';
import { useFetchFromNetlifyFunction } from "./lib/netlifyFunctions";
import { SiteSettings } from "./lib/types";
import ReactGA from "react-ga4";

import '@flaticon/flaticon-uicons/css/all/all.css';

// Run ./launch-dev-server.ps1 to launch development environment. This does the following things:
//  - Runs stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
//  - Automatically updates STRIPE_WEBHOOK_SECRET in .env to the fresh local development test key. 
//  - Runs netlify dev.
// THIS WILL TAKE A MINUTE OR SO TO FINISH LAUCHING.

// Stripe CLI login expires every 90 days, run stripe login to refresh this if you receive an authentication error.
export const LoginContext = createContext<{
  loading: boolean
  loggedIn: boolean
  user: User | null
  permissions: string[]
}>({
  loading: true,
  loggedIn: false,
  user: null,
  permissions: []
})

// TODO: Rename Netlify Environment Variables to VITE_[NAME] to use them in the frontend here.
// This will require refactoring of Netlify functions to use the new variables.
export const SUPABASE_ID = "iumlpfiybqlkwoscrjzt"
export const SUPABASE_DATABASE_URL = `https://${SUPABASE_ID}.supabase.co`
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bWxwZml5YnFsa3dvc2Nyanp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIxNTEyOTEsImV4cCI6MjA1NzcyNzI5MX0.jXIG6uxnvxAhbPDsKuTnFwa9-3fh8odQwYcV0ffQLeE"
export const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY)

export const SiteSettingsContext = createContext<SiteSettings>({})

export function App() {
  // Login Checking
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  async function updateLoginContext() {
    const userResponse = await getUser()
    setUser(userResponse)
    setLoggedIn(!!userResponse)
    if (userResponse) {
      const permissions = userResponse.app_metadata.permissions
      setPermissions(permissions ? permissions : [])
    }
    setLoading(false)
  }

  // Set up notification queue
  let newNotif = useRef<Notif>({id: Date.now(), message: "NullMessage"})
  function notify(msg: string, duration?: number) {
    newNotif.current = {id: Date.now(), message: msg, duration}
    window.dispatchEvent(new CustomEvent("notification"))
  }

  // Fetching Site Settings
  let response = useFetchFromNetlifyFunction("getSiteSettings");
  let siteSettings = response.data
  // Set to empty object if it errored or hasn't finished running yet
  if (typeof siteSettings == "string" || !siteSettings) {
    siteSettings = {}
  }

  // Notify if kill switch enabled, ONLY on start of session
  // Also notify session_notif if in time range
  useEffect(() => {
    const killSwitchNotified = sessionStorage.getItem('killSwitchNotified')
    if (
      siteSettings.kill_switch  
      && siteSettings.kill_switch.enabled 
      && !killSwitchNotified
    ) {
      sessionStorage.setItem("killSwitchNotified", "true")
      console.log("== KILL SWITCH ENABLED ==")
      notify(siteSettings.kill_switch.message)
    }
    const sessionNotifNotified = sessionStorage.getItem("sessionNotifNotified")
    const sessionNotif = siteSettings.session_notif
    const now = new Date()
    if (
      !sessionNotifNotified
      && sessionNotif
      && +(new Date(sessionNotif.endTime)) > +now // Coerce dates to numbers
      && +(new Date(sessionNotif.startTime)) < +now
    ) {
      sessionStorage.setItem("sessionNotifNotified", "true")
      notify(sessionNotif.message, sessionNotif.duration ?? undefined)
    }
  }, [siteSettings])

  // Update Basket if its been longer than 10 minutes
  useEffect(() => {
    // Not necessary on checkout page since a refresh
    // is done serverside as part of checkout 
    // initialisation anyways
    if (window.location.pathname == "/checkout") return

    const basketString = localStorage.getItem("basket")
    if (!basketString) return
    const basketObj = JSON.parse(basketString)
    if (!basketObj.lastUpdated) refreshBasket()
    const timeSinceUpdate = (new Date().getTime()) - (new Date(basketObj.lastUpdated).getTime())
    if (timeSinceUpdate > 600000) refreshBasket()
  }, [])

  // If auth state changes, reauthorise user.
  useEffect(() => {
    const {data: {subscription}} = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          updateLoginContext()
      }})
    // Cleanup function to remove listener when component unmounts to prevent recursive checks
    return () => {subscription.unsubscribe();};
  }, [])
  
  useEffect(() => {updateLoginContext()}, [])

  // Set up GA4 Consent Mode
  useEffect(() => {
    const dev = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"
    if (dev) console.log("In a development environment");

    // Bootstrap gtag + default consent
    (window as any).dataLayer = (window as any).dataLayer || [];
    (window as any).gtag = function () {
      (window as any).dataLayer.push(arguments);
    };

    // Consent Mode V2 defaults (deny until user chooses)
    (window as any).gtag("consent", "default", {
      // deny optional cookies for now.
      ad_storage: "denied",
      analytics_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      // allow essential cookies.
      functionality_storage: 'granted',
      security_storage: 'granted'        
    });

    ReactGA.initialize(import.meta.env.VITE_GA4_MEASUREMENT_ID);

    (window as any).gtag("config", import.meta.env.VITE_GA4_MEASUREMENT_ID, {"debug_mode": dev})

    // Load GA4 library
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${
      import.meta.env.VITE_GA4_MEASUREMENT_ID
    }`;
    document.head.appendChild(script);
  }, [])


  return (<>
    <meta name='author' content='Sam Knight'/>
    <meta name='author' content='Lordimass'/>
    <meta name='creator' content='Sam Knight'/>
    <meta name='creator' content='Lordimass'/>
    <meta name='generator' content='react'/>

    <LoginContext.Provider value={{loggedIn, user, permissions, loading}}>
    <SiteSettingsContext.Provider value={siteSettings}>
    <NotificationsContext.Provider value={{newNotif, notify}}>
    {/**
     * Make sure to update sitemap.mts (Netlify function) to include new static pages
     * in the sitemap 
    */}
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
  
        <Route path="products/*" element={<ProdPage/>} />

        <Route path="checkout" element={<Checkout/>} />
  
        <Route path="thankyou" element={<ThankYou/>} />

        <Route path='login' element={<LoginPage/>} />

        <Route path="staff/orders" element={<OrderManager/>} />
  
        <Route path="privacy" element={<Policy file_name='privacy-policy' title='Privacy Policy' canonical='privacy'/>}/>
        <Route path="returns" element={<Policy file_name='returns' title='Refunds & Returns Policy' canonical='returns'/>}/>
        <Route path="refunds" element={<Policy file_name='returns' title='Refunds & Returns Policy' canonical='returns'/>}/>
        <Route path="cancellations" element={<Policy file_name='cancellation' title='Cancellation Policy' canonical='cancellation'/>}/>
        <Route path="shipping" element={<Policy file_name='shipping' title='Shipping Policy' canonical='shipping'/>}/>

        <Route path="*" element={<Page404/>} />
      </Routes>
    </BrowserRouter>
    </NotificationsContext.Provider>
    </SiteSettingsContext.Provider>
    </LoginContext.Provider></>
  )
}


