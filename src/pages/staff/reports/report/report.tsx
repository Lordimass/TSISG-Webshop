import { useContext } from "react";
import AuthenticatedPage from "../../../../components/page/authenticatedPage";
import { viewPermission } from "../consts";
import BudgetUsage from "../pages/budgetUsage/budgetUsage";
import { Title } from "../pages/title/title";
import { ReportData, ReportDataMeta } from "../types";
import { ReportContext, updateReport, useFetchReport } from "./lib";

import "./report.css"
import { NotificationsContext } from "../../../../components/notification/lib";

export function Report() {
    /** 
     * Update a specific element of the report metadata. This is a shortcut
     * for updateReportData
     */
    async function updateReportMetadata<K extends keyof ReportDataMeta>(
        key: K, 
        value: ReportDataMeta[K],
    ) {
        const metadata = {...report!.metadata}
        metadata[key] = value
        await updateReportData({...report!, metadata})
    }

    async function updateReportData(r: ReportData) {
        await updateReport(r, setReport, notify)
    }

    const {notify} = useContext(NotificationsContext)
    const {loading, report, setReport} = useFetchReport()

    return <AuthenticatedPage 
        id="report"
        requiredPermission={viewPermission}
        loadCondition={!loading} loadingText="Loading Report..."
    >{!loading ?
    <ReportContext.Provider value={{
        report, 
        setReport: updateReportData, 
        setReportMeta: updateReportMetadata
    }}>
        <Title/>
        <hr/>
        <BudgetUsage/>
    </ReportContext.Provider>
    : <></>}</AuthenticatedPage>
}