import { createContext } from "react"
import { ReportData } from "./types"
import { Octokit } from "octokit"

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

// Colour Codes
export const chartBlueDark = "#004561";
export const chartBlueMed = "#3d85c6";
export const chartBlueLight = "#9fc5e8";

export const chartRedDark = "#660000";
export const chartRedMed = "#cc0000";
export const chartRedLight = "#f4cccc";

export const chartYellowDark = "#e69138";
export const chartYellowMed = "#f6b26b";
export const chartYellowLight = "#fce5cd";

export const chartGreenDark = "#38761d";
export const chartGreenMed = "#93c47d";
export const chartGreenLight = "#b6d7a8";

// GitHub REST API Info
export const octokit = new Octokit()
export const GITHUB_OWNER = "Lordimass"
export const GITHUB_REPO = "TSISG-Webshop"

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