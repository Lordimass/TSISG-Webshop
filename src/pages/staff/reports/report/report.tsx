import AuthenticatedPage from "../../../../components/page/authenticatedPage";
import EditableText from "../components/editableText/editableText";
import { viewPermission } from "../lib";
import { ReportContext, useFetchReport } from "./lib";

export function Report() {
    const {loading, report} = useFetchReport()
    return <AuthenticatedPage 
        requiredPermission={viewPermission}
        loadCondition={!loading} loadingText="Loading Report..."
    >{!loading ?
    <ReportContext.Provider value={{report}}>

    </ReportContext.Provider>
    : <></>}</AuthenticatedPage>
}