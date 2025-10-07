import "./reports.css"
import AuthenticatedPage from "../../../components/page/authenticatedPage";
import { useCallRPC } from "../../../lib/supabaseRPC";
import ObjectListItem from "../../../components/objectListItem/objectListItem";
import { JSX, useContext } from "react";
import { NotificationsContext } from "../../../components/notification/lib";
import { LoginContext } from "../../../app";
import { managePermission, viewPermission } from "./lib";

export default function Reports() {
    const title = "TSISG STAFF - Report Manager"
    const canonical = "https://thisshopissogay.com/staff/reports"

    const {notify} = useContext(NotificationsContext)
    const reportsResp = useCallRPC("get_reports", undefined, notify)
    let reportComponents: JSX.Element[] = [<CreateReport/>]
    if (!reportsResp.error && !reportsResp.loading) {
        reportsResp.data.forEach((r: any, i: number) => {reportComponents.push(
            <ObjectListItem key={i}>
                <p>{JSON.stringify(r)}</p>
            </ObjectListItem>
        )})
    }

    return (<AuthenticatedPage
        requiredPermission={viewPermission}
        title={title} 
        id="report-manager-content"
        noindex={true} 
        canonical={canonical}
        loadCondition={!reportsResp.loading}
    >
        {reportComponents}
    </AuthenticatedPage>)
}

function CreateReport() {
    const {loading, permissions} = useContext(LoginContext)
    if (!permissions.includes(managePermission)) return null
    else return (<ObjectListItem>
        <button>Create Report</button>
    </ObjectListItem>)
}