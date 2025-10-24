import ReportSubtitle from "../../components/reportSubtitle"
import "./vulnerabilities.css"

export default function Vulnerabilities() {
    return (<div id="vulnerabilities-page" className="report-page">
        <ReportSubtitle>
            <h2>Potential Vulnerabilities</h2>
            <p>
                I have included this section mostly to log vulnerabilities over time and to show that
                I am aware of them and working on mitigating risk. <a href="http://hostedscan.com">HostedScan</a> results
                for the website are based on data from scans on the 24th of each month.
            </p>
        </ReportSubtitle>
    </div>)
}