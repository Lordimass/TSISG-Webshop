import Footer from "../../components/header-footer/footer";
import Header from "../../components/header-footer/header";
import { page_title } from "../../lib/consts";

import "./404.css"

export default function Page404() {
    return (<><Header/><div className="content content-404">
        <title>{page_title} - 404 Not Found</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/404'/>

        <div id="h404"><h1>404</h1></div>
        <p>We couldn't find that page</p>
        <p id="spacer-404">&nbsp;</p>
        <p id="return-home"><a href="/">Return Home</a></p>
        </div><Footer/></>
    )
}