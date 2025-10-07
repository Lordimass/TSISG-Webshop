import "./reports.css"
import AuthenticatedPage from "../../../components/page/authenticatedPage";

export default function Reports() {
    const viewPermission = "view_reports"
    const managePermission = "manage_reports"
    const title = "TSISG STAFF - Report Manager"
    const canonical = "https://thisshopissogay.com/staff/reports"


    return (<AuthenticatedPage
        requiredPermission={viewPermission}
        title={title} 
        id="report-manager-content"
        noindex={true} 
        canonical={canonical}
    >
        <p>Page is accessible</p>
    </AuthenticatedPage>)
}
