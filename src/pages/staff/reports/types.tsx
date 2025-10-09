export type ReportData = {
    id: number
    /** YYYY-MM-DD start of date range that the report covers */
    start_date: string
    /** YYYY-MM-DD end of date range that the report covers */
    end_date: string
    /** Whether this report is readable by those with the view_reports permission */
    published: boolean
    /** Additional information related to the report */
    metadata: {
        title?: string
        [key: string]: any
    }
}
