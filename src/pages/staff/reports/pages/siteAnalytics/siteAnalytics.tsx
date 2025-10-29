import { useContext, useState, type MouseEvent } from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import { ReportContext } from "../../report/lib"
import "./siteAnalytics.css"
import { fetchFromNetlifyFunction } from "../../../../../lib/netlifyFunctions"
import { getJWTToken } from "../../../../../lib/auth"
import {durationToDurationString, openObjectInNewTab} from "../../../../../lib/lib"
import {FetchAnalyticsResponse, ReadableAnalyticsMetric} from "@shared/types/analyticsTypes.mts";

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
            <NumericalMetric metric={results.activeUsers}/>
            <NumericalMetric metric={results.newUsers}/>
            <NumericalMetric metric={results.newUserPercent}/>
            <NumericalMetric metric={results.pageViewsPerUser}/>
            <DurationMetric metric={results.engagementTime}/>
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

function NumericalMetric({metric}: {metric: ReadableAnalyticsMetric<number>}) {
    let changeRatio = (metric.value - metric.lastValue) / metric.lastValue;
    let changeString = (changeRatio>=0 ? "+" : "") + (changeRatio*100).toFixed(1) + "%"
    return (
        <div className="analytics-metric">
            <p className="label">{metric.label}</p>
            <p className="value">{Math.round(metric.value*10)/10}</p>
            <p className={"change" + (changeRatio>0 ? " green" : changeRatio<0 ? " red" : "")}>{changeString}</p>
        </div>
    )
}

function DurationMetric({metric}: {metric: ReadableAnalyticsMetric<number>}) {
    let change = metric.value - metric.lastValue;
    let changeString = (change>=0 ? "+" : "") + durationToDurationString(change)
    return (
        <div className="analytics-metric">
            <p className="label">{metric.label}</p>
            <p className="value">{durationToDurationString(metric.value)}</p>
            <p className={"change" + (change>0 ? " green" : change<0 ? " red" : "")}>{changeString}</p>
        </div>
    )
}