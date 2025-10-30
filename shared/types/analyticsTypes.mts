export interface FetchAnalyticsResponse {
    /** The period over which these analytics represent */
    period: TimePeriod

    /** The number of active users. */
    activeUsers: ReadableAnalyticsMetric<number>

    /** The number of active users who did not appear in previous periods. */
    newUsers: ReadableAnalyticsMetric<number>

    /** The percentage of active users who were new to the site. */
    newUserPercent: ReadableAnalyticsMetric<number>

    /** How many pages each user viewed on average. */
    pageViewsPerUser: ReadableAnalyticsMetric<number>

    /** How long each user spent on the page in milliseconds, on average. */
    engagementTime: ReadableAnalyticsMetric<number>

    /** How many e-commerce purchases were made in the period */
    eCommercePurchases: ReadableAnalyticsMetric<number>

    /** Total revenue over the period, including delivery */
    totalRevenue: ReadableAnalyticsMetric<number>

    /** Average Revenue Per Paying User  over the period */
    ARPPU: ReadableAnalyticsMetric<number>

    /** Average Revenue Per User over the period */
    ARPU: ReadableAnalyticsMetric<number>

    /** Total Clicks on Google search results over the period */
    clicks: ReadableAnalyticsMetric<number>

    /** The number of times the website was served as a Google search result */
    impressions: ReadableAnalyticsMetric<number>

    /** How total clicks and impressions on Google search results varied over the period */
    clicksAndImpressionsTrend: ClicksAndImpressionsTrend

    /** Data-points representing the number of active users day by day, throughout the period */
    activeUsersTrend: MetricTrend<number>

    /** The products that sold the most in this period, sorted in descending order of `itemsPurchased` */
    bestSellers: ProductAnalytic[]
}

/** A period of time between two dates */
interface TimePeriod {
    /** The start of the period */
    start: Date,
    /** The end of the period */
    end: Date,
}

/** An analytics data-point */
export interface AnalyticsMetric<T> {
    /** The value of the metric in this time period. */
    value: T,

    /** The value of the metric in the last time period. */
    lastValue: T,
}

export interface ReadableAnalyticsMetric<T> extends AnalyticsMetric<T> {
    /** A human-readable name for the metric. */
    label: string,
}

/** A collection of data points */
interface MetricTrend<T> {
    /** A human-readable name for the metric. */
    label: string,
    /** The data points in the collection */
    points: TrendPoint<T>[],
}

/** A point in a trend */
export interface TrendPoint<T> extends AnalyticsMetric<T> {
    /** The date which this point corresponds to in the trend */
    date: Date
    /** The date at which the `lastValue` corresponds to in the trend */
    lastDate: Date
}

/** A collection of metrics relating to a product's performance */
interface ProductAnalytic {
    sku: number
    /** User facing name of the product */
    name: string
    /** The total revenue earned on this product over the period */
    itemRevenue: ReadableAnalyticsMetric<number>
    /** The total number of times this product was purchased */
    itemsPurchased: ReadableAnalyticsMetric<number>
}

/** A special collection of data points for Google search clicks and impressions*/
export interface ClicksAndImpressionsTrend {
    /** A human-readable name for the metric. */
    label: string,
    /** The data points in the collection */
    points: ClicksAndImpressionsTrendPoint[]
}

/** A point of data in a `ClicksAndImpressionsTrend`
 * @see ClicksAndImpressionsTrend
 */
export interface ClicksAndImpressionsTrendPoint {
    date: Date,
    clicks: number
    impressions: number
}[]