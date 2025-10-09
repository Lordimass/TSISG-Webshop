import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabaseRPC";
import { ReportData } from "../types";
import { NotificationsContext } from "../../../../components/notification/lib";

export const ReportContext = createContext<{report?: ReportData}>({})

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
    return {loading, report}
}