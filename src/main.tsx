import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

import Home, { supabase } from './pages/home/home';
import React, { createContext, useEffect, useState } from 'react'
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Staff from './pages/staff/staff';
import Page404 from './pages/404/404';
import DragNDrop from './pages/dragndrop/dragndrop';
import ProdPage from './pages/product/prodPage';
import { getLoggedIn, getUser } from './assets/utils';
import { User } from '@supabase/supabase-js';
import { hierarchy } from './assets/consts';
import Policy from './pages/policies/policies';

// For development environment, run `netlify dev` in the root directory of the project
// Also run the following when developing anything to do with the checkout process 
//    stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed

export const LoginContext = createContext<{
  loggedIn: boolean
  user: User | null
  role: role
}>({
  loggedIn: false,
  user: null,
  role: {
    value: -1,
    name: null
  }
})

type role = {
  value: number,
  name: string | null
}

function App() {
  async function updateLoginContext() {
    const userResponse = await getUser()
    setUser(userResponse)
    setLoggedIn(!!userResponse)
    if (userResponse) {
      const name = userResponse.app_metadata.role
      if (name) {
        setRole({name: name, value: hierarchy.indexOf(name)})
      } else {
        setRole({name: null, value: -1})
      }
    }
  }

  // GA4 Page View Analytics
  useEffect(() => {ReactGA.initialize("G-2RVF60NMM5")})
  const pathname: string = window.location.pathname
  ReactGA.send({hitType:"pageview", page:pathname, title:pathname})

  // Login Checking
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<role>({value: -1, name: null})

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

  return (
    <LoginContext.Provider value={{loggedIn, user, role}}><BrowserRouter>
      <Routes>
        <Route index element={<Home />} />

        <Route path="products/*" element={<ProdPage/>} />
  
        <Route path="checkout" element={<Checkout/>} />
  
        <Route path="thankyou" element={<ThankYou/>} />

        <Route path='login' element={<LoginPage/>} />

        <Route path="staff-portal" element={<Staff/>} />
  
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

const rootEl = document.getElementById("root");

if (rootEl) {
  // Prevent duplicate root creation on hot reload or fast refresh
  if (!(window as any).__root) {
    const root = createRoot(rootEl);
    (window as any).__root = root;
  }

  (window as any).__root.render(<App />);
}