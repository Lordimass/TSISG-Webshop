import { useContext, useState } from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import { ReportContext } from "../../report/lib"
import { LoginContext } from "../../../../../app"

import "./title.css"
import { managePermission } from "../../consts"

export function Title() {
    const {permissions} = useContext(LoginContext)
    const {report: r, setReport: setR, setReportMeta} = useContext(ReportContext)
    if (!r) return

    const [dateStart, setDateStart] = useState(r.start_date)
    const [dateEnd, setDateEnd] = useState(r.end_date)

    function handleStartChange(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateStart(e.target.value)
        setR({...r!, start_date: e.target.value})
    }

    function handleEndChange(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateEnd(e.target.value)
        setR({...r!, end_date: e.target.value})
    }

    return <div id="report-title-page" className="report-page">
    <img id="title-page-logo" src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/logo.svg"/>
    <div id="title-page-text">
        <MDXEditorAuth
            markdown={"# "+ (r.metadata.title ?? "Insert Title")} 
            onChange={(md) => {setReportMeta("title", md.substring(2))}}
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