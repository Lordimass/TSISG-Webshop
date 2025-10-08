import "./common.css"
import '@flaticon/flaticon-uicons/css/all/all.css';

import Home from './pages/home/home';
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Page404 from './pages/404/404';
import Policy from './pages/policies/policies';
import ProdPage from "./pages/products/prodPage";
import Reports from "./pages/staff/reports/reports";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { OrderManager } from './pages/staff/orders/orders';
import { NotificationsContext } from "./components/notification/lib";
import { LoginContext } from "./lib/auth";
import { SiteSettingsContext } from "./lib/types";
import { useConditionalBasketUpdate, useLogin, useNotifs, useSiteSettings } from "./appHooks";
import { Report } from "./pages/staff/reports/report/report";


// Run ./launch-dev-server.ps1 to launch development environment. This does the following things:
//  - Runs stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
//  - Automatically updates STRIPE_WEBHOOK_SECRET in .env to the fresh local development test key. 
//  - Runs netlify dev.
// THIS WILL TAKE A MINUTE OR SO TO FINISH LAUCHING.
//
// Stripe CLI login expires every 90 days, run `stripe login` to refresh this if you receive an authentication error.

export function App() {
  const {loggedIn, user, permissions, loading} = useLogin()
  const {newNotif, notify} = useNotifs()
  const siteSettings = useSiteSettings(notify)
  useConditionalBasketUpdate()

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
        <Route path="staff/reports" element={<Reports/>} />
        <Route path="staff/reports/*" element={<Report/>} />
  
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

export { LoginContext, SiteSettingsContext };

