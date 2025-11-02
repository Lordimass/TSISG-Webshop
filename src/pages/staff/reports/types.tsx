import {FetchAnalyticsResponse} from "@shared/types/analyticsTypes.mts";

export type ReportData = {
    id: number
    /** YYYY-MM-DD start of date range that the report covers */
    start_date: string
    /** YYYY-MM-DD end of date range that the report covers */
    end_date: string
    /** Whether this report is readable by those with the view_reports permission */
    published: boolean
    /** Analytics pulled from Google Analytics Data API */
    ga4_saved_analytics?: FetchAnalyticsResponse
    /** Additional information related to the report */
    metadata: ReportDataMeta
}

export type ReportDataMeta = {
    title?: string
    budgetUsageTable?: string
    totalBudgetTable?: string
    budgetTable?: string
    activityPreGitText?: string
    activityPostGitText?: string
    publishedGitCommits?: string[]
    unpublishedGitCommits?: string[]
    [key: string]: any
}