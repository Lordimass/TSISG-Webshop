import Page from "../../components/page/page";
import { page_title } from "../../lib/consts.ts";

import "./404.css"

export default function Page404() {
    return (<Page
        title = {page_title + "- 404 Not Found"}
        noindex = {true}
        canonical="https://thisshopissogay.com/404"
        id="content-404"
    >
        <div id="h404"><h1>404</h1></div>
        <p>We couldn't find that page</p>
        <p id="spacer-404">&nbsp;</p>
        <p id="return-home"><a href="/">Return Home</a></p>
     </Page>
    )
}