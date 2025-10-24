import { useContext, useState } from "react";
import AuthenticatedPage from "../../../../components/page/authenticatedPage";
import { managePermission, viewPermission } from "../consts";
import BudgetUsage from "../pages/budgetUsage/budgetUsage";
import { Title } from "../pages/title/title";
import { ReportData, ReportDataMeta } from "../types";
import { ReportContext, updateReport, useFetchReport } from "./lib";

import "./report.css"
import { NotificationsContext } from "../../../../components/notification/lib";
import EmployeeHours from "../pages/employeeHours/employeeHours";
import { Activity } from "../pages/activity/activity";
import { LoginContext } from "../../../../app";
import IssueTracking from "../pages/issueTracking/issueTracking";
import SiteAnalytics from "../pages/siteAnalytics/siteAnalytics";
import Vulnerabilities from "../pages/vulnerabilities/vulnerabilities";
import AttainmentOfPlan from "../pages/attainmentOfPlan/attainmentOfPlan";
import Plan from "../pages/plan/plan";

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
        metadata[key] = value !== "" ? value : undefined
        await updateReportData({...report!, metadata})
    }

    async function updateReportData(r: ReportData) {
        await updateReport(r, setReport, notify)
    }

    const {notify} = useContext(NotificationsContext)
    const {permissions} = useContext(LoginContext)
    const {loading, report, setReport} = useFetchReport()

    const [viewMode, setViewMode] = useState(false)

    return <AuthenticatedPage 
        id="report"
        requiredPermission={viewPermission}
        loadCondition={!loading} loadingText="Loading Report..."
    >{!loading ?
    <ReportContext.Provider value={{
        report, 
        setReport: updateReportData, 
        setReportMeta: updateReportMetadata,
        viewMode
    }}>
        {/* Button to allow editors to view document as a viewer */}
        {permissions.includes(managePermission) ? 
        <div id="view-mode-button-container">
            <button id="view-mode-button" onClick={() => setViewMode(!viewMode)}>
                {viewMode ? "Enable Edit Mode" : "Enable View Mode"}
            </button>
        </div> : null}

        {/* Report Body */}
        <Title/>
        <hr/>
        <BudgetUsage/>
        <hr/>
        <EmployeeHours/>
        <hr/>
        <Activity/>
        <hr/>
        <IssueTracking/>
        <hr/>
        <SiteAnalytics/>
        <hr/>
        <Vulnerabilities/>
        <hr/>
        <AttainmentOfPlan/>
        <hr/>
        <Plan/>
    </ReportContext.Provider>
    : <></>}</AuthenticatedPage>
}