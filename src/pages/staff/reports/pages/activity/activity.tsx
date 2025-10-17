import { useContext } from "react";
import MDXEditorAuth from "../../components/MDXEditorAuth";
import ReportSubtitle from "../../components/reportSubtitle";
import { ReportContext } from "../../report/lib";

export function Activity() {
    const {report: r, setReportMeta: setR} = useContext(ReportContext)
    
    if (!r) {return null}
    return (<div id="report-activity-page" className="report-page">
        <ReportSubtitle>
            <h2>Activity</h2>
            <p>A summary of activity and progress made by everyone contributing to the website.</p>
        </ReportSubtitle>

        <MDXEditorAuth
            id="activity-pre-git"
            markdown={r.metadata.activityPreGitText ?? ""}
        />
    </div>)
}