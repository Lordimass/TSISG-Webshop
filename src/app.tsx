import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

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
import { keywords_meta } from './assets/consts';
import { refreshBasket } from './lib/lib';
import { Notif, NotificationsContext } from './assets/components/notification';
import { useFetchFromNetlifyFunction } from "./lib/netlifyFunctions";

// Run ./launch-dev-server.ps1 to launch development environment. This does the following things:
//  - Runs stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
//  - Automatically updates STRIPE_WEBHOOK_SECRET in .env to the fresh local development test key. 
//  - Runs netlify dev.
// THIS WILL TAKE A MINUTE OR SO TO FINISH LAUCHING.

// Stripe CLI login expires every 90 days, run stripe login to refresh this if you receive an authentication error.
export const LoginContext = createContext<{
  loggedIn: boolean
  user: User | null
  permissions: string[]
}>({
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

export const SiteSettingsContext = createContext<any>({})

export function App() {
  async function updateLoginContext() {
    const userResponse = await getUser()
    setUser(userResponse)
    setLoggedIn(!!userResponse)
    if (userResponse) {
      const permissions = userResponse.app_metadata.permissions
      setPermissions(permissions ? permissions : [])
    }
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

  // Login Checking
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState([])

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

  // GA4 Page View Analytics
  useEffect(() => {
    const pathname: string = window.location.pathname
    const dev = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"
    if (dev) console.log("In a development environment")
    ReactGA.initialize(import.meta.env.VITE_GA4_MEASUREMENT_ID, {gaOptions: {debug_mode: dev}})
    ReactGA.send({
      hitType: "pageview", 
      page: pathname, 
      title: pathname,
      environment: import.meta.env.VITE_ENVIRONMENT
    })
  }, [])


  return (<>
    <meta name='author' content='Sam Knight'/>
    <meta name='author' content='Lordimass'/>
    <meta name='creator' content='Sam Knight'/>
    <meta name='creator' content='Lordimass'/>
    <meta name='generator' content='react'/>
    <meta name='keywords' content={keywords_meta}/>

    <LoginContext.Provider value={{loggedIn, user, permissions}}>
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


