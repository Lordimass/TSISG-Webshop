import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ReactGA from "react-ga4"

import Home from './pages/home/home';
import React from 'react'
import Checkout from './pages/checkout/checkout';
import ReturnPolicy from './pages/policies/return-policy';
import CancellationPolicy from './pages/policies/cancellation-policy';
import ShippingPolicy from './pages/policies/shipping-policy';
import PrivacyPolicy from './pages/policies/privacy-policy';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Staff from './pages/staff/staff';
import Page404 from './pages/404/404';
import DragNDrop from './pages/dragndrop/dragndrop';

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
  
        <Route path="privacy" element={<PrivacyPolicy/>}/>
        <Route path="returns" element={<ReturnPolicy/>}/>
        <Route path="refunds" element={<ReturnPolicy/>}/>
        <Route path="cancellations" element={<CancellationPolicy/>}/>
        <Route path="shipping" element={<ShippingPolicy/>}/>

        <Route path="dragndrop" element={<DragNDrop/>}/>

        <Route path="*" element={<Page404 />} />
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


