import ReportSubtitle from "../../components/reportSubtitle"
import "./issueTracking.css"

export default function IssueTracking() {
    return (<div id="issue-tracking-page" className="report-page">
        <ReportSubtitle>
            <h2>GitHub Issue Tracking</h2>
            <p>
                The word “issue” refers both to bugs and to requested features/enhancements. 
                Having open issues is not a bad thing necessarily, it just means that there's 
                plenty of room for improvement.
            </p>
        </ReportSubtitle>
    </div>)
}