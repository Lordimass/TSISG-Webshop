import { useContext } from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import { ReportContext } from "../../report/lib"
import "./siteAnalytics.css"

export default function SiteAnalytics() {
    const {report: r, setReportMeta: setR} = useContext(ReportContext)
    if (!r) return null
    return (<div id="site-analytics-page" className="report-page">
        <ReportSubtitle>
            <h2>Site Analytics</h2>
            <p>This is only a snapshot of the analytics captured, I can provide a more in depth report on request.</p>
        </ReportSubtitle>
         <MDXEditorAuth
             id="analytics-text"
             markdown={r.metadata.analyticsText ?? ""}
             background={true}
             toolbar={true}
             onChange={(md) => {setR("analyticsText", md)}}
         />
    </div>)
}