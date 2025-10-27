import { useContext, useState, type MouseEvent } from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import { ReportContext } from "../../report/lib"
import "./siteAnalytics.css"
import { fetchFromNetlifyFunction } from "../../../../../lib/netlifyFunctions"
import { getJWTToken } from "../../../../../lib/auth"
import { openObjectInNewTab } from "../../../../../lib/lib"

export default function SiteAnalytics() {
    const {report: r, setReportMeta: setR} = useContext(ReportContext)
    const [results, setResults] = useState<any>(undefined)

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
            openObjectInNewTab(data)
        }
    }

    if (!r) return null
    return (<div id="site-analytics-page" className="report-page">
        <ReportSubtitle>
            <h2>Site Analytics</h2>
            <p>This is only a snapshot of the analytics captured, I can provide a more in depth report on request.</p>
        </ReportSubtitle>
        <button onClick={handleButtonPress}>Fetch</button>
        <pre>{JSON.stringify(results, undefined, 2)}</pre>
        <MDXEditorAuth
             id="analytics-text"
             markdown={r.metadata.analyticsText ?? ""}
             background={true}
             toolbar={true}
             onChange={(md) => {setR("analyticsText", md)}}
         />
    </div>)
}