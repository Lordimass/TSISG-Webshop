import {ChangeEvent, JSX, RefObject, useContext, useEffect, useRef, useState} from "react";
import MDXEditorAuth from "../../components/MDXEditorAuth";
import ReportSubtitle from "../../components/reportSubtitle";
import {ReportContext} from "../../report/lib";

import "./activity.css"
import {Commit, getAllGithubCommits, getCommitMessage} from "./lib";
import {LoginContext} from "../../../../../app";
import {managePermission} from "../../consts";

export function Activity() {
    const {rRef, setReportMeta: setR} = useContext(ReportContext)
    const r = rRef?.current
    if (!r) return

    const [commits, setCommits] = useState<Commit[]>()
    useEffect(() => {
        async function fetch() {
            const res = await getAllGithubCommits(r!.start_date, r!.end_date)
            setCommits(res)
        }
        fetch().then()
    }, [])
    
    if (!rRef) {return null}
    return (<div id="report-activity-page" className="report-page">
        <ReportSubtitle>
            <h2>Activity</h2>
            <p>A summary of activity and progress made by everyone contributing to the website.</p>
        </ReportSubtitle>

        <MDXEditorAuth
            id="activity-pre-git"
            markdown={r.metadata.activityPreGitText ?? ""}
            background={true}
            toolbar={true}
            onChange={(md) => {setR("activityPreGitText", md)}}
        />

        <GitCommits commits={commits} published={true} title={<>Published GitHub Commits</>} subtitle={<>
            Completed features and changes that have been made public on the website. 
            Non-exhaustive, a complete list is 
            available <a href="https://github.com/Lordimass/TSISG-Webshop/commits/main/">here</a>.
        </>} />

        <GitCommits commits={commits} published={false} title={<>Unpublished GitHub Commits</>} subtitle={<>
            Features and changes that have not yet been made public on the website. Non-exhaustive, a
            list of active branches and their commits is
            available <a href="https://github.com/Lordimass/TSISG-Webshop/branches/active">here</a>.
        </>} />

        <div className="box">
            <h2>Other Progress</h2>
            <p className="subtitle">Progress not represented by GitHub Commits</p>
            <MDXEditorAuth
                id="activity-post-git"
                markdown={r.metadata.activityPostGitText ?? ""}
                background={true}
                toolbar={true}
                onChange={(md) => {setR("activityPostGitText", md)}}
            />
        </div>

    </div>)
}

function GitCommits({commits, published, title, subtitle}: {commits?: Commit[], published?: boolean, title:JSX.Element, subtitle:JSX.Element}) {
    const {rRef} = useContext(ReportContext)
    const selectedSHAs = useRef(published
        ? rRef?.current?.metadata.publishedGitCommits ?? []
        : rRef?.current?.metadata.unpublishedGitCommits ?? [])

    return (<div className="box git-commits" id={(published ? "published" : "unpublished") + "-git-commits"}>
        <h2>{title}</h2>
        <p className="subtitle">{subtitle}</p>
        {<>{commits && commits.length>0 ? <div className="commit-list">
            {commits.map(c => <GitCommit c={c} published={published} key={c.sha} selectedSHAs={selectedSHAs}/>)}
        </div> : <p>GitHub API Limit Reached, please try again later</p>}</>}
        <br/>
    </div>)
}

function GitCommit({c, published=false, selectedSHAs} : {c: Commit, published?: boolean, selectedSHAs: RefObject<string[]>}) {
    const {permissions} = useContext(LoginContext)
    const {viewMode, setReportMeta} = useContext(ReportContext)
    const editMode = !viewMode && permissions.includes(managePermission)

    const [checked, setChecked] = useState(selectedSHAs.current?.includes(c.sha) ?? false)

    async function handleCheck(e: ChangeEvent<HTMLInputElement>) {
        const newChecked = !checked
        if (newChecked) { // Show the commit
            selectedSHAs.current.push(c.sha)
        } else { // Hide the commit
            selectedSHAs.current = selectedSHAs.current.filter((sha) => sha !== c.sha)
        }
        await setReportMeta(
            published ? "publishedGitCommits" : "unpublishedGitCommits",
            selectedSHAs.current
        )
        setChecked(newChecked)
    }

    if (!editMode && !checked) return null
    return (<div className="git-commit" id={`commit-${c.sha}`} key={c.sha}>
        {editMode ? <input 
            type="checkbox"
            checked={checked}
            onChange={handleCheck}
        /> : null}
        <div className="commit-body"><span className="commit-header">
            <p className="commit-name">
                Commit <a href={c.html_url}>{c.sha.substring(0,7)}</a> -
                {" " + c.commit.message.split("\n")[0]}
            </p>
            {c.stats ? <p className="lines-changed">
                <span className="lines-added">{c.stats?.additions}</span>
                <span className="lines-removed">{c.stats?.deletions}</span>
                lines changed
            </p> : null}
        </span>
        <span className="message">
            {getCommitMessage(c)}
        </span></div>
    </div>)
}