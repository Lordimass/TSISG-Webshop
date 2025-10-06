import { useContext } from "react";
import { LoginContext } from "../../../app";

import "./reports.css"
import { NotLoggedIn } from "../lib";
import Page from "../../../components/page/page";

export default function Reports() {
    const viewPermission = "view_reports"
    const managePermission = "manage_reports"
    const title = "TSISG STAFF - Report Manager"
    const canonical = "https://thisshopissogay.com/staff/reports"

    const loginContext = useContext(LoginContext)
    const content = !loginContext.permissions.includes(viewPermission) && !loginContext.loading 
        ? <NotLoggedIn/> 
        : <p>Reports accessible!</p>

    return (<Page 
        title={title} 
        id="report-manager-content"
        noindex={true} 
        canonical={canonical}
        loadCondition={!loginContext.loading}
    >
        {content}
    </Page>)
}
