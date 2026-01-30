import {useContext} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import ReportSubtitle from "../../components/reportSubtitle"
import {ReportContext} from "../../report/lib"

export default function AttainmentOfPlan() {
    const {rRef, setReportMeta: setR} = useContext(ReportContext)
    const r = rRef?.current
    if (!r) return null

    return (<div id="attainment-of-plan-page" className="report-page">
        <ReportSubtitle>
            <h2>Attainment of Month's Plan</h2>
            <p>To what extent did we achieve the goals set out in the previous monthly report?</p>
        </ReportSubtitle>
         <MDXEditorAuth
             id="attainment"
             markdown={r.metadata.attainment ?? ""}
             background={true}
             toolbar={true}
             onChange={async (md) => {await setR("attainment", md)}}
         />
         <MDXEditorAuth
             id="attainment-box-2"
             markdown={r.metadata.attainmentBox2 ?? ""}
             background={true}
             toolbar={true}
             onChange={async (md) => {await setR("attainmentBox2", md)}}
         />
    </div>)
}