import {ChangeEvent, useContext, useState} from "react"
import MDXEditorAuth from "../../components/MDXEditorAuth"
import {ReportContext} from "../../report/lib"
import {LoginContext} from "../../../../../app"

import "./title.css"
import {managePermission} from "../../consts"

export function Title() {
    const {permissions} = useContext(LoginContext)
    const {rRef, setReport: setR, setReportMeta, viewMode} = useContext(ReportContext)
    const r = rRef?.current
    if (!r) return

    const [dateStart, setDateStart] = useState(r.start_date)
    const [dateEnd, setDateEnd] = useState(r.end_date)

    async function handleStartChange(e: ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateStart(e.target.value)
        await setR({...r!, start_date: e.target.value})
    }

    async function handleEndChange(e: ChangeEvent<HTMLInputElement>) {
        e.preventDefault()
        setDateEnd(e.target.value)
        await setR({...r!, end_date: e.target.value})
    }

    return <div id="report-title-page" className="report-page">
    <img id="title-page-logo" src="https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets/logo.svg"/>
    <div id="title-page-text">
        <MDXEditorAuth
            markdown={"# "+ (r.metadata.title ?? "Insert Title")}
            onChange={async (md) => {await setReportMeta("title", md.substring(2))}}
        />
        <div className="date-range">
            <input 
                type="date" 
                id="date-range-start"
                disabled={!permissions.includes(managePermission) || viewMode}
                value={dateStart}
                onChange={handleStartChange}
            /><p>-</p>
            <input 
                type="date"
                id="date-range-end"
                disabled={!permissions.includes(managePermission) || viewMode}
                value={dateEnd}
                onChange={handleEndChange}
            />
        </div>
    </div>

    </div>
}