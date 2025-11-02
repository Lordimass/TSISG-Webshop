import {type MouseEvent, useContext} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import {ReportContext} from "../../report/lib"
import "./siteAnalytics.css"
import {fetchFromNetlifyFunction} from "../../../../../lib/netlifyFunctions"
import {getJWTToken, LoginContext} from "../../../../../lib/auth"
import {FetchAnalyticsResponse} from "@shared/types/analyticsTypes.mts";
import {DurationMetric, MonetaryMetric, NumericalMetric} from "./metricComponents.tsx";
import {Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts";
import {dateToDateString} from "../../../../../lib/lib.tsx";
import {chartBlueLight, chartBlueMed, chartPurpleDark, managePermission} from "../../consts.tsx";
import JSONTable from "../../components/JSONTable.tsx";
import {NotificationsContext} from "../../../../../components/notification/lib.tsx";

export default function SiteAnalytics() {
    const {report: r, setReportMeta: setRMeta, setReport, viewMode} = useContext(ReportContext)
    const {notify} = useContext(NotificationsContext)
    const {permissions} = useContext(LoginContext)

    const edit = permissions.includes(managePermission) && !viewMode

    async function fetchFreshData(e: MouseEvent<HTMLButtonElement>) {
        e.preventDefault()
        if (!r) return
        const {data, error} = await fetchFromNetlifyFunction("fetchGA4Analytics", JSON.stringify({
            start: r.start_date,
            end: r.end_date
        }), getJWTToken())
        if (error) {
            notify("An error occured while fetching fresh report data: error.message");
        } else {
            await setReport({...r, ga4_saved_analytics: data});
        }
    }

    if (!r) return null

    return (<div id="site-analytics-page" className="report-page">
        <ReportSubtitle>
            <h2>Site Analytics</h2>
            <p>This is only a snapshot of the analytics captured, I can provide a more in depth report on request.</p>
        </ReportSubtitle>

        {/* Fetch fresh report data button, only viewable to editors */}
        {edit
            ?
            <div id="fetch-analytics-button-container">
                <button id="fetch-analytics-button" onClick={fetchFreshData}>
                    Fetch Analytics Data
                </button>
            </div>
            : null
        }

        {/* General Analytics */}
        <AnalyticsSummaryMetrics results={r.ga4_saved_analytics} />
        <div className="analytics-charts-container">
            <ActiveUsersTrend results={r.ga4_saved_analytics} />
            <CAndITrend results={r.ga4_saved_analytics} />
        </div>
        <CAndISummaryMetrics results={r.ga4_saved_analytics} />
        <hr style={{height: "2px"}}/>

        {/* E-Commerce Analytics */}
        <EComSummaryMetrics results={r.ga4_saved_analytics} />
        <JSONTable
            json={r.ga4_saved_analytics?.bestSellers}
            title={"Best Sellers"}
            columnNames={["SKU", "Name", "Item Revenue (£)", "Items Purchased", "Refund Amount (£)"]}
            columnTypes={[undefined, "string", "money", undefined, "money"]}
            style={{alignSelf: "center"}}
            id="best-sellers-table"
        />

        {/* Text box for any additional comments on the analytics */}
        <MDXEditorAuth
             id="analytics-text"
             markdown={r.metadata.analyticsText ?? ""}
             background={true}
             toolbar={true}
             onChange={(md) => setRMeta("analyticsText", md)}
        />
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

function ActiveUsersTrend({results}: {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div id="active-users-trend" className="analytics-chart-container">
        <h2>Active Users</h2>
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

function CAndITrend({results}: {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div id="clicks-and-impressions-trend" className="analytics-chart-container">
        <h2>Google Clicks & Impressions</h2>
        <ResponsiveContainer width={"100%"} height={250}>
            <LineChart data={results.clicksAndImpressionsTrend.points} className="lineChart">
                <Line
                    name={"Clicks"}
                    dataKey={"clicks"}
                    dot={false}
                    strokeWidth={3}
                    stroke={chartBlueMed}
                />
                <Line
                    name={"Impressions"}
                    dataKey={"impressions"}
                    dot={false}
                    strokeWidth={3}
                    stroke={chartPurpleDark}
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
                    labelFormatter={label => dateToDateString(new Date(label))}
                    // [val, dateToDateString(new Date(props.payload.date))]
                />
            </LineChart>
        </ResponsiveContainer>
    </div>)
}

function CAndISummaryMetrics({results}: {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div className="analytics-summary-metrics">
            <NumericalMetric metric={results.clicks} />
            <NumericalMetric metric={results.impressions} />
    </div>)
}

function EComSummaryMetrics({results}: {results?: FetchAnalyticsResponse}) {
    if (!results) return null
    return (<div className="analytics-summary-metrics">
        <NumericalMetric metric={results.eCommercePurchases} />
        <MonetaryMetric metric={results.totalRevenue} />
        <MonetaryMetric metric={results.ARPPU} />
        <MonetaryMetric metric={results.ARPU} />
        <MonetaryMetric metric={results.refundAmount} positiveDirection={"DECREASE"} />
    </div>)
}