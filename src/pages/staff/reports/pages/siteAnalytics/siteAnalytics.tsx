import {type MouseEvent, useContext, useState} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import {ReportContext} from "../../report/lib"
import "./siteAnalytics.css"
import {fetchFromNetlifyFunction} from "../../../../../lib/netlifyFunctions"
import {getJWTToken} from "../../../../../lib/auth"
import {FetchAnalyticsResponse} from "@shared/types/analyticsTypes.mts";
import {DurationMetric, NumericalMetric} from "./metricComponents.tsx";
import {Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {dateToDateString} from "../../../../../lib/lib.tsx";
import {chartBlueLight, chartBlueMed} from "../../consts.tsx";

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

        <AnalyticsSummaryMetrics results={results} />
        <ActiveUsersTrend results={results} />

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

function ActiveUsersTrend({results}: {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div id="active-users-trend" className="analytics-chart-container">
        <h2>Active Users Trend</h2>
        <ResponsiveContainer width={"100%"} height={250}>
            <LineChart data={results.activeUsersTrend.points} className="lineChart">
                <Line
                    name={"This Period"}
                    dataKey={"value"}
                    dot={false}
                    strokeWidth={3}
                    stroke={chartBlueMed}
                />
                <Line
                    name={"Last Period"}
                    dataKey={"lastValue"}
                    dot={false}
                    strokeWidth={2}
                    stroke={chartBlueLight}
                />
                <XAxis
                    dataKey={"date"}
                    tickFormatter={val => dateToDateString(new Date(val), true)}
                    tickMargin={7}
                    interval={"preserveStartEnd"}
                    minTickGap={30}
                />
                <YAxis
                    interval={"preserveStartEnd"}
                />
                <Tooltip
                    labelFormatter={label => ""}
                    formatter={(val, _, props) => {
                        let date = props.payload.date
                        let label = "This Period, "
                        if (props.dataKey === "lastValue") {
                            date = props.payload.lastDate
                            label = "Last Period, "
                        }
                        return [val, label + dateToDateString(new Date(date), true)]
                    }}
                    // [val, dateToDateString(new Date(props.payload.date))]
                />
            </LineChart>
        </ResponsiveContainer>
    </div>)
}

function AnalyticsSummaryMetrics({results} : {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div className="analytics-summary-metrics">
        <NumericalMetric metric={results.activeUsers} />
        <NumericalMetric metric={results.newUsers} />
        <NumericalMetric metric={results.newUserPercent} positiveDirection={"NEUTRAL"} />
        <NumericalMetric metric={results.pageViewsPerUser} />
        <DurationMetric metric={results.engagementTime} />
    </div>)
}