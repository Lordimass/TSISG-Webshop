import {Fragment, useContext, useState} from "react";
import AuthenticatedPage from "../../../../components/page/authenticatedPage";
import {managePermission, viewPermission} from "../consts";
import BudgetUsage from "../pages/budgetUsage/budgetUsage";
import {Title} from "../pages/title/title";
import {ReportData, ReportDataMeta} from "../types";
import {ReportContext, updateReport, useFetchReport} from "./lib";

import "./report.css"
import {NotificationsContext} from "../../../../components/notification/lib";
import EmployeeHours from "../pages/employeeHours/employeeHours";
import {Activity} from "../pages/activity/activity";
import {LoginContext} from "../../../../app";
import IssueTracking from "../pages/issueTracking/issueTracking";
import SiteAnalytics from "../pages/siteAnalytics/siteAnalytics";
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
        const metadata = {...reportRef.current!.metadata}
        metadata[key] = value !== "" ? value : undefined
        await updateReportData({...reportRef.current!, metadata})
    }

    async function updateReportData(r: ReportData) {
        await updateReport(r, reportRef, notify)
    }

    const {notify} = useContext(NotificationsContext)
    const {permissions} = useContext(LoginContext)
    const {loading, reportRef} = useFetchReport()

    // Allows the report to be rerendered automatically
    const [forceRerenderVal, setForceRerenderVal] = useState<boolean>(false);
    function forceRerender() {setForceRerenderVal(!forceRerenderVal)}

    const [viewMode, setViewMode] = useState(false)
    const components = [
        <Title/>, <BudgetUsage/>, <EmployeeHours/>, <Activity/>, <IssueTracking/>, <SiteAnalytics/>,
        <AttainmentOfPlan/>, <Plan/>
    ]

    return <AuthenticatedPage 
        id="report"
        requiredPermission={viewPermission}
        loadCondition={!loading} loadingText="Loading Report..."
    >{!loading ?
    <ReportContext.Provider value={{
        r: reportRef.current,
        setReport: updateReportData, 
        setReportMeta: updateReportMetadata,
        viewMode, forceRerender
    }}>
        {/* Button to allow editors to view document as a viewer */}
        {permissions.includes(managePermission) ? 
        <div id="view-mode-button-container">
            <button id="view-mode-button" onClick={() => setViewMode(!viewMode)}>
                {viewMode ? "Enable Edit Mode" : "Enable View Mode"}
            </button>
        </div> : null}

        {/* Report Body */}
        {components.map((c, i) => {return <Fragment key={i}>{c}<br/></Fragment>})}

    </ReportContext.Provider>
    : <></>}</AuthenticatedPage>
}