import {useContext} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import {ReportContext} from "../../report/lib"

export default function Plan() {
    const {rRef, setReportMeta: setR} = useContext(ReportContext)
    const r = rRef?.current
    if (!r) return null

    return (<div id="plan-page" className="report-page">
        <ReportSubtitle>
            <h2>Plan Moving Forward</h2>
            <p>
                This plan is preliminary and is entirely subject to change throughout the month. 
                This section aims only to loosely set out the aims of the following month.
            </p>
        </ReportSubtitle>
        <MDXEditorAuth
            id="plan"
            markdown={r.metadata.plan ?? ""}
            background={true}
            toolbar={true}
            onChange={(md) => {setR("plan", md).then()}}
        />
        <MDXEditorAuth
            id="plan-box-2"
            markdown={r.metadata.planBox2 ?? ""}
            background={true}
            toolbar={true}
            onChange={(md) => {setR("planBox2", md).then()}}
        />
    </div>)
}