import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

import Home, { supabase } from './pages/home/home';
import React, { createContext, useEffect, useState } from 'react'
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Page404 from './pages/404/404';
import DragNDrop from './pages/dragndrop/dragndrop';
import { getUser } from './assets/utils';
import { User } from '@supabase/supabase-js';
import Policy from './pages/policies/policies';
import { OrderManager } from './pages/staff/orders';

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

function App() {
  async function updateLoginContext() {
    const userResponse = await getUser()
    setUser(userResponse)
    setLoggedIn(!!userResponse)
    if (userResponse) {
      const permissions = userResponse.app_metadata.permissions
      setPermissions(permissions ? permissions : [])
    }
  }

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


  return (
    <LoginContext.Provider value={{loggedIn, user, permissions}}><BrowserRouter>
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
    </BrowserRouter></LoginContext.Provider>
  )
}

const rootEl = document.getElementById("root")
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App/>)
} else {
  console.error("Couldn't find root element!")
}


