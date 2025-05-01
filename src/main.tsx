import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home/home';
import React from 'react'
import Checkout from './pages/checkout/checkout';
import ReturnPolicy from './pages/policies/return-policy';
import CancellationPolicy from './pages/policies/cancellation-policy';
import ShippingPolicy from './pages/policies/shipping-policy';
import PrivacyPolicy from './pages/policies/privacy-policy';

createRoot(document.getElementById('root') as HTMLElement).render(
    <BrowserRouter>
      <Routes>

        <Route index element={<Home />} />

        <Route path="checkout" element={<Checkout/>} />

        <Route path="privacy" element={<PrivacyPolicy/>}/>

        <Route path="returns" element={<ReturnPolicy/>}/>
        <Route path="refunds" element={<ReturnPolicy/>}/>
        <Route path="refunds and returns" element={<ReturnPolicy/>}/>

        <Route path="cancellations" element={<CancellationPolicy/>}/>

        <Route path="shipping" element={<ShippingPolicy/>}/>

      </Routes>
    </BrowserRouter>
);

