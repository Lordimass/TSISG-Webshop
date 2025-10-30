import {type MouseEvent, useContext, useState} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import {ReportContext} from "../../report/lib"
import "./siteAnalytics.css"
import {fetchFromNetlifyFunction} from "../../../../../lib/netlifyFunctions"
import {getJWTToken} from "../../../../../lib/auth"
import {FetchAnalyticsResponse} from "@shared/types/analyticsTypes.mts";
import {DurationMetric, NumericalMetric} from "./metricComponents.tsx";

export default function SiteAnalytics() {
    const {report: r, setReportMeta: setR} = useContext(ReportContext)
    const [results, setResults] = useState<FetchAnalyticsResponse>()

    async function handleButtonPress(e: MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        const {data, error} = await fetchFromNetlifyFunction("fetchGA4Analytics", JSON.stringify({
            start: r!.start_date,
            end: r!.end_date
        }), getJWTToken())
        if (error) {
            setResults(error.message)
        } else {
            setResults(data)
        }
    }

    if (!r) return null
    return (<div id="site-analytics-page" className="report-page">
        <ReportSubtitle>
            <h2>Site Analytics</h2>
            <p>This is only a snapshot of the analytics captured, I can provide a more in depth report on request.</p>
        </ReportSubtitle>
        <button onClick={handleButtonPress}>Fetch</button>
        {results ? <div className="analytics-summary-metrics">
            <NumericalMetric metric={results.activeUsers} />
            <NumericalMetric metric={results.newUsers} />
            <NumericalMetric metric={results.newUserPercent} positiveDirection={"NEUTRAL"} />
            <NumericalMetric metric={results.pageViewsPerUser} />
            <DurationMetric metric={results.engagementTime} />
            </div> : null}

        <pre>{JSON.stringify(results, undefined, 2)}</pre>
        <MDXEditorAuth
             id="analytics-text"
             markdown={r.metadata.analyticsText ?? ""}
             background={true}
             toolbar={true}
             onChange={(md) => setR("analyticsText", md)}
         />
    </div>)
}