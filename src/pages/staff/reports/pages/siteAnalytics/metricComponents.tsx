import {ReadableAnalyticsMetric} from "@shared/types/analyticsTypes.mts";
import {durationToDurationString} from "../../../../../lib/lib.tsx";

function Metric({
                    label, value, change,
                    changeValue,
                    positiveDirection = "INCREASE"
                }: {
    label: string, value: string, change: string,
    changeValue: number,
    positiveDirection?: "INCREASE" | "DECREASE" | "NEUTRAL"
}) {
    // Colour class based on which direction is the direction we want it to go in.
    // There may be a which we want to decrease, rather than increase, therefore a decrease
    // is a positive change and should be shown in the positive colour (green)
    const increaseColour = positiveDirection === "NEUTRAL"
        ? ""
        : positiveDirection === "INCREASE"
            ? " green"
            : " red"
    const decreaseColour = positiveDirection === "NEUTRAL"
        ? ""
        : positiveDirection === "DECREASE"
            ? " green"
            : " red"
    return (
        <div className="analytics-metric">
            <p className="label">{label}</p>
            <p className="value">{value}</p>
            <p className={"change" + (changeValue > 0 ? increaseColour : changeValue < 0 ? decreaseColour : "")}>
                {change}
            </p>
        </div>
    )
}

export function NumericalMetric({
                                    metric,
                                    positiveDirection = "INCREASE"
                                }: {
    metric: ReadableAnalyticsMetric<number>
    positiveDirection?: "INCREASE" | "DECREASE" | "NEUTRAL"
}) {
    let changeRatio = (metric.value - metric.lastValue) / metric.lastValue;
    let changeString = (changeRatio >= 0 ? "+" : "") + (changeRatio * 100).toFixed(1) + "%"
    return (
        <Metric
            label={metric.label}
            value={(Math.round(metric.value * 10) / 10).toString(10)}
            change={changeString}
            changeValue={changeRatio}
            positiveDirection={positiveDirection}
        />
    )
}

export function DurationMetric({
                                   metric,
                                   positiveDirection = "INCREASE"
                               }: {
    metric: ReadableAnalyticsMetric<number>,
    positiveDirection?: "INCREASE" | "DECREASE" | "NEUTRAL"
}) {
    let change = metric.value - metric.lastValue;
    let changeString = (change >= 0 ? "+" : "") + durationToDurationString(change)
    return (
        <Metric
            label={metric.label}
            value={durationToDurationString(metric.value)}
            change={changeString}
            changeValue={change}
            positiveDirection={positiveDirection}
        />
    )
}

export function MonetaryMetric({
                                   metric,
                                   positiveDirection = "INCREASE"
                               }: {
    metric: ReadableAnalyticsMetric<number>,
    positiveDirection?: "INCREASE" | "DECREASE" | "NEUTRAL"
}) {
    let changeRatio = (metric.value - metric.lastValue) / metric.lastValue;
    let changeString = (changeRatio >= 0 ? "+" : "") + (changeRatio * 100).toFixed(1) + "%"
    return (
        <Metric
            label={metric.label}
            value={"£" + metric.value.toFixed(2)}
            change={changeString}
            changeValue={changeRatio}
            positiveDirection={positiveDirection}
        />
    )
}