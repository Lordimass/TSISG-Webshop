import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from './pages/home/home';
import React from 'react'
import Checkout from './pages/checkout/checkout';
import { CheckoutProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

createRoot(document.getElementById('root') as HTMLElement).render(
    <BrowserRouter>
      <Routes>
        <Route index element={<Home />} />
        <Route path='checkout' element={<Checkout/>} />
      </Routes>
    </BrowserRouter>
);

