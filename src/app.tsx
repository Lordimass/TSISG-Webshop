import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

import Home, { supabase } from './pages/home/home';
import React, { createContext, RefObject, useEffect, useRef, useState } from 'react'
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Page404 from './pages/404/404';
import DragNDrop from './pages/dragndrop/dragndrop';
import { fetchFromNetlifyFunction, getUser } from './assets/utils';
import { User } from '@supabase/supabase-js';
import Policy from './pages/policies/policies';
import { OrderManager } from './pages/staff/orders';
import ReactDOM from 'react-dom';
import { keywords_meta, page_title } from './assets/consts';

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

export const SiteSettingsContext = createContext<any>({})

export const NotificationsContext = createContext<{
  newNotif: RefObject<Notif>,
  notify: (message: string) => void
}>({
  newNotif: {current: {id: Date.now(), message: "NullMessage"}},
  notify: (message: string) => {console.error(`Notify method does not exist, failed to notify with message: ${message}`)}
})
type Notif = { id: number; message: string };


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
  function notify(msg: string) {
    newNotif.current = {id: Date.now(), message: msg}
    window.dispatchEvent(new CustomEvent("notification"))
  }

  // Fetching Site Settings
  let siteSettings = fetchFromNetlifyFunction("getSiteSettings");
  if ( // Set to empty object if it errored or hasn't finished running yet
    typeof siteSettings == "string" ||
    Object.prototype.toString.call(siteSettings) === '[object Array]'
  ) {
    siteSettings = {}
  }

  // Notify if kill switch enabled, ONLY on start of session
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

  }, [siteSettings])


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
    const dev = import.meta.env.VITE_ENVIRONMENT == "DEVELOPMENT"
    console.log (dev ? "In a development environment" : "")
    ReactGA.initialize("G-2RVF60NMM5", {gaOptions: {debug_mode: dev}})
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
  
        <Route path="checkout" element={<Checkout/>} />
  
        <Route path="thankyou" element={<ThankYou/>} />

        <Route path='login' element={<LoginPage/>} />

        <Route path="staff/orders" element={<OrderManager/>} />
  
        <Route path="privacy" element={<Policy file_name='privacy-policy'/>}/>
        <Route path="returns" element={<Policy file_name='returns'/>}/>
        <Route path="refunds" element={<Policy file_name='returns'/>}/>
        <Route path="cancellations" element={<Policy file_name='cancellation'/>}/>
        <Route path="shipping" element={<Policy file_name='shipping'/>}/>

        <Route path="dragndrop" element={<DragNDrop/>}/>

        <Route path="*" element={<Page404/>} />
      </Routes>
    </BrowserRouter>
    </NotificationsContext.Provider>
    </SiteSettingsContext.Provider>
    </LoginContext.Provider></>
  )
}


