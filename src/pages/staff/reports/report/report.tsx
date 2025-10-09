import Page from "../../../../components/page/page";
import { ReportContext, useFetchReport } from "./lib";

export function Report() {
    const {loading, report} = useFetchReport()
    return <Page loadCondition={!loading} loadingText="Loading Report...">{!loading ?
    <ReportContext.Provider value={{report}}>
        

    </ReportContext.Provider>
    : <></>}</Page>
}