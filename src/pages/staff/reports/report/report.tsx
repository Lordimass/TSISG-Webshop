import AuthenticatedPage from "../../../../components/page/authenticatedPage";
import { viewPermission } from "../lib";
import { Title } from "../pages/title/Title";
import { ReportContext, useFetchReport } from "./lib";

import "./report.css"

export function Report() {
    const {loading, report, setReport} = useFetchReport()

    return <AuthenticatedPage 
        id="report"
        requiredPermission={viewPermission}
        loadCondition={!loading} loadingText="Loading Report..."
    >{!loading ?
    <ReportContext.Provider value={{report, setReport}}>
        <Title/>
        <hr/>
    </ReportContext.Provider>
    : <></>}</AuthenticatedPage>
}