import { useContext, useRef, useState } from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import "./Title.css"
import { ReportContext, updateReport } from "../../report/lib"
import { NotificationsContext } from "../../../../../components/notification/lib"
import { LoginContext } from "../../../../../app"
import { managePermission } from "../../lib"

export function Title() {
    const {permissions} = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)
    const {report: r, setReport: setR} = useContext(ReportContext)
    if (!r) return

    const [dateStart, setDateStart] = useState(r.start_date)
    const [dateEnd, setDateEnd] = useState(r.end_date)

    function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateStart(e.target.value)
        updateReport({...r!, start_date: e.target.value}, setR, notify)
    }
    function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateEnd(e.target.value)
        updateReport({...r!, end_date: e.target.value}, setR, notify)
    }

    return <div id="report-title-page" className="report-page">
    <img id="title-page-logo" src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/logo.svg"/>
    <div id="title-page-text">
        <MDXEditorAuth 
            markdown={"# "+ (r.metadata.title ?? "Insert Title")} 
            onChange={(e) => {updateReport({...r, metadata: {...r.metadata, title: e.substring(2)}}, setR, notify)}}
        />
        <div className="date-range">
            <input 
                type="date" 
                id="date-range-start"
                disabled={!permissions.includes(managePermission)}
                value={dateStart}
                onChange={handleStartChange}
            /><p>-</p>
            <input 
                type="date"
                id="date-range-end"
                disabled={!permissions.includes(managePermission)}
                value={dateEnd}
                onChange={handleEndChange}
            />
        </div>
        
    </div>

    </div>
}