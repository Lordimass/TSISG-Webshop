import 'bootstrap/dist/css/bootstrap.css';
import "./global.css"

import type {Metadata} from "next";
import type {ReactNode} from "react";
import Header from "../components/HeaderFooter/Header.tsx";
import Footer from "../components/HeaderFooter/Footer.tsx";
import LocaleContextProvider from "@/lib/context/locale.tsx";
import RemoteSettingsContextProvider from "@/lib/context/remoteSettings.tsx";
import ToastWrapper from "@/components/ToastWrapper/ToastWrapper.tsx";

export const metadata: Metadata = {
    title: "This Shop Is So GAY",
    icons: {icon: "/favicon.ico"},
    authors: [
        {name: "Lordimass", url: "https://lordimass.net"},
        {name: "Sam Knight", url: "https://lordimass.net"}
    ],
    creator: "Lordimass",
    generator: "Next.js",
    description: "The official online shop for This Shop Is So Gay in York! We sell queer and LGBTQ merchandise of " +
        "all kinds and deliver it straight to your door :D"
}

export default function RootLayout({
    children,
}: {
    children: ReactNode
}) {
    // TODO: CookieBanner

    return <html lang="en"><body>
    <div id="root">
        <LocaleContextProvider>
            <RemoteSettingsContextProvider>
                <ToastWrapper>
                    <LayoutContextInternal>
                        {/*<UseGA4Consent/>*/}
                        {/*<GoogleAnalytics*/}
                        {/*    gaId={process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID!}*/}
                        {/*    debugMode={process.env.NODE_ENV !== "production"}*/}
                        {/*/>*/}
                        {children}
                    </LayoutContextInternal>
                </ToastWrapper>
            </RemoteSettingsContextProvider>
        </LocaleContextProvider>
    </div>
    </body></html>
}

function LayoutContextInternal({children}: { children: ReactNode }) {

    return (<>
            <Header/>
            <main>{children}</main>
            <Footer/>
        </>
    )
}