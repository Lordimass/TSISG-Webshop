import { createContext } from "react"
import { ReportData } from "./types"

export const viewPermission = "view_reports"
export const managePermission = "manage_reports"

export const ReportsContext = createContext<{
   reports: ReportData[]
   setReports: React.Dispatch<React.SetStateAction<ReportData[]>>
}>({
    reports: [],
    setReports: ()=>{}
})