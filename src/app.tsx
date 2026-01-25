import "./common.css"
import '@flaticon/flaticon-uicons/css/all/all.css';
import '@mdxeditor/editor/style.css'

import Home from './pages/home/home';
import Checkout from './pages/checkout/checkout';
import ThankYou from './pages/thankyou/thankyou';
import LoginPage from './pages/login/login';
import Page404 from './pages/404/404';
import Policy from './pages/policies/policies';
import ProdPage from "./pages/products/prodPage";
import Reports from "./pages/staff/reports/reports";

import {BrowserRouter, Route, Routes} from "react-router-dom";
import {OrderManager} from './pages/staff/orders/orders';
import {NotificationsContext} from "./components/notification/lib";
import {LoginContext} from "./lib/auth";
import {SiteSettingsContext} from "@shared/types/types";
import {useConditionalBasketUpdate, useLogin, useNotifs, useSiteSettings} from "./appHooks";
import {Report} from "./pages/staff/reports/report/report";
import useLocale, {LocaleContext} from "./localeHandler.ts";
import {getRoute} from "./lib/paths.ts";
import {ErrorBoundary} from "react-error-boundary"
import Fallback from "./pages/fallback/fallback.tsx";
import Products from "./pages/staff/products/products.tsx";

// Run ./launch-dev-server.ps1 to launch development environment. This does the following things:
//  - Runs stripe listen --forward-to localhost:8888/.netlify/functions/createOrder --events checkout.session.completed
//  - Automatically updates STRIPE_WEBHOOK_SECRET in .env to the fresh local development test key. 
//  - Runs netlify dev.
// THIS WILL TAKE A MINUTE OR SO TO FINISH LAUNCHING.
//
// Stripe CLI login expires every 90 days, run `stripe login` to refresh this if you receive an authentication error.

export function App() {
    const {newNotif, notify} = useNotifs()
    const {loggedIn, user, permissions, loading} = useLogin()
    const siteSettings = useSiteSettings(notify)
    const localeContext = useLocale();
    useConditionalBasketUpdate()

    return (<ErrorBoundary
            fallbackRender={(props) => <Fallback {...props}/>}
            FallbackComponent={undefined}
            fallback={undefined} onError={(e, info) => {
                console.error(e)
                notify(`Something went wrong! "${e.name}: ${e.message}"`)
        }}>
        <meta name='author' content='Sam Knight'/>
        <meta name='author' content='Lordimass'/>
        <meta name='creator' content='Sam Knight'/>
        <meta name='creator' content='Lordimass'/>
        <meta name='generator' content='react'/>

        <NotificationsContext.Provider value={{newNotif, notify}}>
        <LoginContext.Provider value={{loggedIn, user, permissions, loading}}>
        <SiteSettingsContext.Provider value={siteSettings}>
        <LocaleContext.Provider value={localeContext}>
            {/**
             * Make sure to update sitemap.mts (Netlify function) to include new static pages
             * in the sitemap
             */}
            <BrowserRouter>
                <Routes>
                    <Route index element={<Home/>}/>

                    <Route path={getRoute("PRODUCT")} element={<ProdPage/>}/>

                    <Route path={getRoute("CHECKOUT")} element={<Checkout/>}/>

                    <Route path={getRoute("POST_CHECKOUT")} element={<ThankYou/>}/>

                    <Route path={getRoute("LOGIN")} element={<LoginPage/>}/>

                    <Route path={getRoute("ORDERS")} element={<OrderManager/>}/>
                    <Route path={getRoute("REPORTS")} element={<Reports/>}/>
                    <Route path={getRoute("REPORT")} element={<Report/>}/>
                    <Route path={getRoute("STAFF_PRODUCTS")} element={<Products/>}/>

                    <Route path={getRoute("PRIVACY_POLICY")} element={
                        <Policy file_name='privacy-policy' title='Privacy Policy' canonical='privacy'/>}/>
                    <Route path={getRoute("REFUNDS_POLICY")} element={
                        <Policy file_name='returns' title='Refunds & Returns Policy' canonical='returns'/>}/>
                    <Route path={getRoute("RETURNS_POLICY")} element={
                        <Policy file_name='returns' title='Refunds & Returns Policy' canonical='returns'/>}/>
                    <Route path={getRoute("CANCELLATIONS_POLICY")} element={
                        <Policy file_name='cancellation' title='Cancellation Policy' canonical='cancellation'/>}/>
                    <Route path={getRoute("SHIPPING_POLICY")} element={
                        <Policy file_name='shipping' title='Shipping Policy' canonical='shipping'/>}/>

                    <Route path={getRoute("404")} element={<Page404/>}/>
                </Routes>
            </BrowserRouter>
        </LocaleContext.Provider>
        </SiteSettingsContext.Provider>
        </LoginContext.Provider>
        </NotificationsContext.Provider>
    </ErrorBoundary>)
}

export {LoginContext, SiteSettingsContext};

