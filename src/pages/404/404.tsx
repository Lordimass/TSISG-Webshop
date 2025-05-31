import Footer from "../../assets/components/footer";
import Header from "../../assets/components/header";

import "./404.css"

export default function Page404() {
    return (<><Header/><div className="content content-404">
    <div id="h404"><h1>404</h1></div>
    <p>We couldn't find that page</p>
    <p id="spacer-404">&nbsp;</p>
    <p id="return-home"><a href="/">Return Home</a></p>
    </div><Footer/></>)
}