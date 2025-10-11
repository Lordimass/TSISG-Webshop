import { createContext } from "react"
import { ReportData } from "./types"

/** Permission required to view reports */
export const viewPermission = "view_reports"
/** Permission required to edit, create, or delete reports */
export const managePermission = "manage_reports"

/** 
 * Access to all current reports, as well as the ability to set
 * their data ephemerally. 
*/
export const ReportsContext = createContext<{
   reports: ReportData[]
   setReports: React.Dispatch<React.SetStateAction<ReportData[]>>
}>({
    reports: [],
    setReports: ()=>{}
})

/** 
 * The default budget usage table markdown to display if one does
 * not exist for the current report 
*/
export const DEFAULT_BUDGET_USAGE_TABLE = `
    | Average | Last Month | This Month |
    | :-: | :-: | :-: |
    | £ | £ | £ |
    ---  
    | Average | Last Month | This Month |
    | :-: | :-: | :-: |
    | % | % | % |
`

/** 
 * The default budget total monthly budget table markdown to 
 * display if one does not exist for the current report 
*/
export const DEFAULT_TOTAL_BUDGET_TABLE = `
    | Current Total Monthly Budget |
    | :-: |
    | £ 200 |
`

/** 
 * The default budget breakdown table markdown to display if 
 * one does not exist for the current report 
*/
export const DEFAULT_BUDGET_TABLE = `
    | Spent on | Total Expense | Justification |
    | :-- | :-- | :-- |
    | | £  | |
    | | £  | |
    | | £  | |
`