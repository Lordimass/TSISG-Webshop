import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseRPC";
import { ReportData, ReportDataMeta } from "../types";
import { NotificationsContext } from "../../../../components/notification/lib";

/** How long to wait (in seconds) before performing another save to Supabase */
const SAVE_INTERVAL = 5

export const ReportContext = createContext<{
    report?: ReportData
    setReport: (r: ReportData) => Promise<void>
    setReportMeta: <K extends keyof ReportDataMeta>(key: K, value: ReportDataMeta[K]) => Promise<void>
    viewMode?: boolean
}>({
    setReport: () => {return new Promise(()=>{})},
    setReportMeta: () => {return new Promise(()=>{})},
    viewMode: false
})

/**
 * Fetches the report associated with the current page
 */
async function fetchReport(notify: (msg: string) => void): Promise<ReportData | undefined> {
    const path = window.location.pathname.split("/")
    const id = path[path.length-1]
    const fetchResp = await supabase.from("reports").select("*").eq("id", id)
    if (fetchResp.error) {
        notify(fetchResp.error.message)
        return
    }
    return fetchResp.data[0]
}

/**
 * Hook to fetch the report associated with the current page
 */
export function useFetchReport() {
    const {notify} = useContext(NotificationsContext)
    const [loading, setLoading] = useState(true)
    const [report, setReport] = useState<ReportData>()
    useEffect(() => {
        async function fetch() {
            setReport(await fetchReport(notify))
            setLoading(false);
        }
        fetch()
    }, [])
    return {loading, report, setReport}
}

/**
 * WARNING: Do not use this function, it is intended only for use in `report.tsx`, 
 * use `setReport` from `ReportContext` instead!
 * 
 * Update the remote report with fresh data
 */
export async function updateReport(
    r: ReportData, 
    setR: (r: ReportData) => void,
    notify: (msg: string) => void, 
) {
    // Clear previous waiting cooldown
    const oldID = localStorage.getItem("updateReportTimeoutID")
    if (oldID) window.clearTimeout(oldID)
    setR(r)

    // Check if it's been long enough since the last update
    const lastUpdate = Number(localStorage.getItem("lastReportSave")) ?? -1
    const timeRemaining = SAVE_INTERVAL*1000 - (Date.now() - lastUpdate)
    if (lastUpdate === -1 || timeRemaining <= 0) {
        // Update supabase
        const updateResp = await supabase.from("reports").update(r).eq("id", r.id)
        if (updateResp.error) notify(updateResp.error.message);
        localStorage.setItem("lastReportSave", String(Date.now()))
        console.log("Saved.")
        
    } else {
        // Still on cooldown, try again once cooldown has expired
        const id = window.setTimeout(() => {updateReport(r, setR, notify)}, timeRemaining)
        localStorage.setItem("updateReportTimeoutID", String(id))
    }
}