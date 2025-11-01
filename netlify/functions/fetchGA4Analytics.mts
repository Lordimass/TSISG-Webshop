import { Context } from "@netlify/functions";
import { getSupabaseUserPermissions } from "../lib/getSupabaseClient.mts";
import getBetaAnalyticsDataClient from "../lib/betaAnalyticsDataClient.mts";
import {
    ClicksAndImpressionsTrendPoint,
    FetchAnalyticsResponse, ProductAnalytic, ReadableAnalyticsMetric,
    TrendPoint
} from "@shared/types/analyticsTypes.mjs";
import assert from "node:assert";
import {google} from "@google-analytics/data/build/protos/protos"

type IRow = google.analytics.data.v1beta.IRow;
type IFilterExpression = google.analytics.data.v1beta.IFilterExpression;
type IRunReportResponse = google.analytics.data.v1beta.IRunReportResponse;

type Body = {
    start: string;
    end: string;
}

const PROPERTY = "properties/487921084";

/** Filter to apply to GA4 analytics requests */
const FILTER: IFilterExpression = {
    notExpression: { filter: {
            fieldName: "transactionID",
            stringFilter: {
                matchType: "CONTAINS",
                value: "_test_"
            }}
    }
}

/**
 * Fetches an analytics report from Google Analytics 4.
 * @see Body
 * @see FetchAnalyticsResponse
 * @returns {Promise<Response>} Analytics data matching FetchAnalyticsResponse interface
 */
export default async function handler(request: Request, _context: Context): Promise<Response> { try {
    /** Get user metrics, engagement metrics, and e-commerce metrics */
    async function fetchMainMetrics() {
        return await client.runReport({
            property: PROPERTY,
            dateRanges: [
                { startDate: formattedStart, endDate: formattedEnd },
                { startDate: formattedLastStart, endDate: formattedLastEnd }
            ],
            metrics: [
                { name: "activeUsers" },
                { name: "newUsers" },
                { name: "screenPageViewsPerUser" },
                { name: "userEngagementDuration" },
                { name: "transactions" },
                { name: "totalRevenue" }
            ],
            dimensionFilter: FILTER
        });
    }

    /** Get daily trends */
    async function fetchDailyTrends() {
        return await client.runReport({
            property: PROPERTY,
            dateRanges: [
                { startDate: formattedLastStart, endDate: formattedEnd }
            ],
            dimensions: [{ name: "date" }],
            metrics: [
                { name: "activeUsers" }
            ],
            orderBys: [
                { dimension: { dimensionName: "date" } }
            ]
        });
    }

    /**
     *  Fetch daily search trends, separate to other daily trends since including these with the other trends seems to
     *  modify the values of other trends???
     */
    async function fetchDailySearchTrends(start: string, end: string) {
        return await client.runReport({
            property: PROPERTY,
            dateRanges: [
                { startDate: start, endDate: end }
            ],
            dimensions: [{ name: "date" }],
            metrics: [
                { name: "organicGoogleSearchClicks" },
                { name: "organicGoogleSearchImpressions" }
            ],
            orderBys: [
                { dimension: { dimensionName: "date" } }
            ]
        });
    }

    /** Get best-selling products */
    async function fetchBestSellers() {
        return await client.runReport({
            property: PROPERTY,
            dateRanges: [
                { startDate: formattedStart, endDate: formattedEnd }
            ],
            dimensions: [
                { name: "itemId" },
                { name: "itemName" }
            ],
            metrics: [
                { name: "itemRevenue" },
                { name: "itemsPurchased" },
                { name: "itemRefundAmount" }
            ],
            orderBys: [
                { metric: { metricName: "itemsPurchased" }, desc: true }
            ],
            dimensionFilter: FILTER,
            limit: 10
        });
    }

    const perms = await getSupabaseUserPermissions(request)
    if (!perms.includes("view_reports")) return new Response(undefined, {status: 403})
    const { start, end } = await request.json() as Body

    // Calculate the last period (e.g. last 30 days)
    const startStamp = Date.parse(start)
    const endStamp = Date.parse(end)
    const periodLength = endStamp - startStamp
    const lastPeriodStart = new Date(startStamp - periodLength - 1)
    const lastPeriodEnd = new Date(startStamp - 1)

    const client = await getBetaAnalyticsDataClient();

    // Format dates in YYYY-MM-DD format as required by GA4
    const formattedStart = start.split('T')[0];
    const formattedEnd = end.split('T')[0];
    const formattedLastStart = (lastPeriodStart.toISOString().split('T'))[0];
    const formattedLastEnd = (lastPeriodEnd.toISOString().split('T'))[0];

    // Fetch data
    const [mainMetrics] = await fetchMainMetrics();
    const [trends] = await fetchDailyTrends();
    const [searchTrends] = await fetchDailySearchTrends(formattedStart, formattedEnd);
    const [lastSearchTrends] = await fetchDailySearchTrends(formattedLastStart, formattedLastEnd);
    const [productMetrics] = await fetchBestSellers();
    console.log("Data fetched")

    // Extract flat metrics from main metrics
    const currentActiveUsers = getMetricValue(mainMetrics, 1, 0);
    const lastActiveUsers = getMetricValue(mainMetrics, 0, 0);
    const currentNewUsers = getMetricValue(mainMetrics, 1, 1);
    const lastNewUsers = getMetricValue(mainMetrics, 0, 1);
    const currentRevenue = getMetricValue(mainMetrics, 1, 5);
    const lastRevenue = getMetricValue(mainMetrics, 0, 5);
    const currentPurchases = getMetricValue(mainMetrics, 1, 4);
    const lastPurchases = getMetricValue(mainMetrics, 0, 4);

    const response: FetchAnalyticsResponse = {
        period: {
            start: new Date(start),
            end: new Date(end)
        },
        activeUsers: createMetric("Active Users", currentActiveUsers, lastActiveUsers),
        newUsers: createMetric("New Users", currentNewUsers, lastNewUsers),
        newUserPercent: createMetric(
            "New User Percentage",
            currentActiveUsers ? (currentNewUsers / currentActiveUsers) * 100 : 0,
            lastActiveUsers ? (lastNewUsers / lastActiveUsers) * 100 : 0
        ),
        pageViewsPerUser: createMetric(
            "Page Views per User",
            getMetricValue(mainMetrics, 0, 2),
            getMetricValue(mainMetrics, 1, 2)
        ),
        engagementTime: createMetric(
            "Engagement Time",
            getMetricValue(mainMetrics, 0, 3),
            getMetricValue(mainMetrics, 1, 3)
        ),
        eCommercePurchases: createMetric(
            "E-commerce Purchases",
            currentPurchases,
            lastPurchases
        ),
        totalRevenue: createMetric(
            "Total Revenue",
            currentRevenue,
            lastRevenue
        ),
        ARPPU: createMetric(
            "ARPPU",
            currentPurchases ? currentRevenue / currentPurchases : 0,
            lastPurchases ? lastRevenue / lastPurchases : 0
        ),
        ARPU: createMetric(
            "ARPU",
            currentActiveUsers ? currentRevenue / currentActiveUsers : 0,
            lastActiveUsers ? lastRevenue / lastActiveUsers : 0
        ),
        clicks: createMetric(
            "Clicks",
            calculateTotal(searchTrends.rows || [], 0),
            calculateTotal(lastSearchTrends.rows || [], 0)
        ),
        impressions: createMetric(
            "Impressions",
            calculateTotal(searchTrends.rows || [], 1),
            calculateTotal(lastSearchTrends.rows || [], 1)
        ),
        activeUsersTrend: {
            label: "Active Users",
            points: calculateTrend(trends, 0, new Date(startStamp))
        },
        clicksAndImpressionsTrend: {
            label: "Search Clicks & Impressions",
            points: calculateClicksAndImpressionsTrend(searchTrends, new Date(startStamp))
        },
        bestSellers: calculateBestSellers(productMetrics)
    };
    return new Response(JSON.stringify(response))

} catch(e: any) {console.error(e); return new Response(e.message, {status: e.status ?? 500})}}

/**
 * Helper functions for parsing GA4 metrics
 */
function getMetricValue(report: IRunReportResponse, rowIndex: number, metricIndex: number): number {
    return Number(report.rows?.[rowIndex]?.metricValues?.[metricIndex]?.value || 0);
}

function createMetric<T>(label: string, value: T, lastValue: T): ReadableAnalyticsMetric<T> {
    return { label, value, lastValue };
}

function calculateTotal(rows: IRow[] | undefined, metricIndex: number): number {
    return rows?.reduce(
        (sum, row) => sum + Number(row.metricValues?.[metricIndex]?.value || 0), 0
    ) || 0;
}

function calculateTrend(report: IRunReportResponse, metricIndex: number, startDate: Date): TrendPoint<number>[] {
    if (!report.rows) return [];
    const trend: TrendPoint<number>[] = [];
    const halfWay = report.rows.length/2
    for (let i = 0; i < halfWay; i++) {
        const last = report.rows[i]
        const current = report.rows[i+halfWay]
        trend.push({
            lastDate: getDate(last.dimensionValues?.[0]?.value || "19700101"),
            date: getDate(current.dimensionValues?.[0]?.value || "19700101"),
            lastValue: Number(last.metricValues?.[metricIndex]?.value || 0),
            value: Number(current.metricValues?.[metricIndex]?.value || 0)
        })
    }
    return trend.filter(point => point.date.getTime() >= startDate.getTime());
}

function calculateClicksAndImpressionsTrend(
    report: IRunReportResponse,
    startDate: Date
): ClicksAndImpressionsTrendPoint[] {
    if (!report.rows) return [];
    const trend: ClicksAndImpressionsTrendPoint[] = [];
    for (let i = 0; i < report.rows.length; i++) {
        const row = report.rows[i]
        const date = getDate(row.dimensionValues?.[0]?.value || "19700101")
        if (date.getTime() < startDate.getTime()) continue;
        trend.push({
            date: getDate(row.dimensionValues?.[0]?.value || "19700101"),
            clicks: Number(row.metricValues?.[0]?.value || 0),
            impressions: Number(row.metricValues?.[1]?.value || 0)
        })
    }
    return trend
}

/**
 * @param date A date string in YYYYMMDD format, as returned by GA4
 * @returns A date object containing the timestamp at the start of <code>day</code>
 */
function getDate(date: string): Date {
    assert(date.length === 8, `Date string has invalid length: ${date}`);
    const day = date.substring(6);
    const month = date.substring(4,6);
    const year = date.substring(0,4);
    return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
}

function calculateBestSellers(report: IRunReportResponse): ProductAnalytic[] {
    if (!report.rows || !report.rowCount) return [];
    const halfPoint = Math.floor(report.rowCount / 2);
    return report.rows.slice(0, halfPoint).map((row, index) => {
        const lastPeriodRow = report.rows?.[index + halfPoint];
        return {
            sku: Number(row.dimensionValues?.[0].value),
            name: row.dimensionValues?.[1].value || "",
            itemRevenue: Number(row.metricValues?.[0].value),
            itemsPurchased: Number(row.metricValues?.[1].value),
            itemRefundAmount: Number(row.metricValues?.[2].value)
        };
    });
}