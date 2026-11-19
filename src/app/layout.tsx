import {Metadata} from "next";
import {ReactNode} from "react";

import "./global.css"

export const metadata: Metadata = {
    title: "This Shop Is So GAY",
    icons: {icon: "/favicon.ico"}
}

export default function RootLayout({
    children,
}: {
    children: ReactNode
}) {
    return <html lang="en">
        <body>
            <div id="root">{children}</div>
        </body>
    </html>
}