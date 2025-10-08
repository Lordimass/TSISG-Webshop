import "./reports.css"
import AuthenticatedPage from "../../../components/page/authenticatedPage";
import { supabase, useCallRPC } from "../../../lib/supabaseRPC";
import ObjectListItem from "../../../components/objectListItem/objectListItem";
import { JSX, useContext, useEffect, useRef, useState } from "react";
import { NotificationsContext } from "../../../components/notification/lib";
import { LoginContext } from "../../../app";
import { managePermission, ReportsContext, viewPermission } from "./lib";
import { ReportData } from "./types";

export default function Reports() {
    const title = "TSISG STAFF - Report Manager"
    const canonical = "https://thisshopissogay.com/staff/reports"

    const {notify} = useContext(NotificationsContext)

    // Fetch reports
    const reportsResp = useCallRPC("get_reports", undefined, notify)
    const [reports, setReports] = useState<ReportData[]>([])
    useEffect(()=>{
        if (!reportsResp.loading || reportsResp.data) {
            setReports(reportsResp.data)
        }}, [reportsResp.loading])

    // Create report components
    let reportComponents: JSX.Element[] = []
    if (reports.length > 0) {
        reports.forEach((r: any, i: number) => {reportComponents.push(
            <ObjectListItem key={i}>
                <p>{JSON.stringify(r)}</p>
            </ObjectListItem>
        )})
        reportComponents = [<CreateReport key={-1}/>, ...reportComponents]
    }

    return (<AuthenticatedPage
        requiredPermission={viewPermission}
        title={title} 
        id="report-manager-content"
        noindex={true} 
        canonical={canonical}
        loadCondition={!reportsResp.loading}
    ><ReportsContext.Provider value={{reports, setReports}}>
        {reportComponents}
    </ReportsContext.Provider></AuthenticatedPage>)
}

function CreateReport() {
    const {notify} = useContext(NotificationsContext)
    const {permissions} = useContext(LoginContext)

    const toggleDropdown = useRef<(() => void)>(undefined)
    const [startDate, setStartDate] = useState<string>("")
    const [endDate, setEndDate] = useState<string>("")
    const [title, setTitle] = useState<string>("Monthly Report")

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        // Validate Inputs
        if (!startDate || !endDate) {
            notify("Date range must be filled in")
            return
        }
        const [start, end] = [new Date(startDate), new Date(endDate)]
        if (start.getTime() > end.getTime()) {
            notify("Start date must come before end date.")
            return
        }

        // Create report in database
        const insertResp = await supabase.from("reports").insert({
            start_date: startDate, end_date: endDate,
            metadata: {title}
        }).select() 
        if (insertResp.error) {
            notify(`An error occured when creating the report:
                 ${insertResp.error.message}`)
            return
        }

        // Redirect to page for the report
        window.location.replace(`/${startDate}-${endDate}`)
    } 

    if (!permissions.includes(managePermission)) return null
    else return (<ObjectListItem 
        style="yellow" 
        hideDropdownToggles={true}
        toggleDropdownFunction={toggleDropdown}
        dropdown={<form id="create-report-form" onSubmit={handleSubmit}>
        <label>Date Range:
            <input 
                id="start-date" 
                type="date" 
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
            />-
            <input 
                id="end-date" 
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
            />
        </label>

        <label>Report Title:<input
            id="report-title"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={50}
        /></label>

        <input type="submit" value={"Create"}></input>
    </form>}>
        <button 
            onClick={() => {if (toggleDropdown.current) {toggleDropdown.current()}}}
        >Create New Report</button>
    </ObjectListItem>)
}