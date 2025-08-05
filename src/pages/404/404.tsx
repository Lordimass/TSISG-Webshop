import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";
import { page_title } from "../../assets/consts";

import "./404.css"

export default function Page404() {
    return (<><Header/><div className="content content-404">
        <title>{page_title} - 404 Not Found</title>
        <meta name="robots" content="noindex"/>

        <div id="h404"><h1>404</h1></div>
        <p>We couldn't find that page</p>
        <p id="spacer-404">&nbsp;</p>
        <p id="return-home"><a href="/">Return Home</a></p>
        </div><Footer/></>
    )
}