import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

import Home from './pages/home/home';
import React from 'react'
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Staff from './pages/staff/staff';
import Page404 from './pages/404/404';
import DragNDrop from './pages/dragndrop/dragndrop';
import Policy from './pages/policies/policies';

// For development environment, run `netlify dev` in the root directory of the project
// Also run the following when developing anything to do with the checkout process 
//    stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed

function App() {
  const pathname: string = window.location.pathname
  ReactGA.initialize("G-2RVF60NMM5")
  ReactGA.send({hitType:"pageview", page:pathname, title:pathname})
  return (
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
  
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
    </BrowserRouter>
  )
}

const rootEl = document.getElementById("root")
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App/>)
} else {
  console.error("Couldn't find root element!")
}


