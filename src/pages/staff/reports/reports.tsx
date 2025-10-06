import { useContext } from "react";
import Footer from "../../../components/header-footer/footer";
import Header from "../../../components/header-footer/header";
import { LoginContext } from "../../../app";
import Throbber from "../../../components/throbber/throbber";

import "./reports.css"
import { NotLoggedIn } from "../lib";

export default function Reports() {
    const viewPermission = "view_reports"
    const managePermission = "manage_reports"

    const loginContext = useContext(LoginContext)
    if (loginContext.loading) return (
        <><Header/><div className="content" id="report-manager-content">
            <title>TSISG STAFF - Report Manager</title>
            <meta name="robots" content="noindex"/>
            <link rel='canonical' href='https://thisshopissogay.com/staff/reports'/>
            <div className="loading-screen">
                <Throbber/>
            </div>
        </div><Footer/></>
    )
    else if (!(loginContext.permissions.includes(viewPermission))) return (
        <><Header/><div className="content" id="report-manager-content">
            <title>TSISG STAFF - Report Manager</title>
            <meta name="robots" content="noindex"/>
            <link rel='canonical' href='https://thisshopissogay.com/staff/reports'/>
            <NotLoggedIn/>
        </div><Footer/></>
    )

    return (<><Header/><div className="content" id="report-manager-content">
        <title>TSISG STAFF - Report Manager</title>
        <meta name="robots" content="noindex"/>
        <link rel='canonical' href='https://thisshopissogay.com/staff/reports'/>
    </div><Footer/></>);
}
