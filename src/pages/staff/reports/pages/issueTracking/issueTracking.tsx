import { useContext } from "react"
import ReportSubtitle from "../../components/reportSubtitle"
import "./issueTracking.css"
import { ReportContext } from "../../report/lib"
import { InputAuth } from "../../components/MDXEditorAuth"
import { dateToDateString } from "../../../../../lib/lib"
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { chartBlueDark, chartBlueLight, chartBlueMed, chartGreenDark, chartGreenLight, chartGreenMed, chartRedDark, chartRedLight, chartRedMed, chartYellowDark, chartYellowLight, chartYellowMed, managePermission } from "../../consts"
import { LoginContext } from "../../../../../app"

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

        {/* TODO: Automate collection of this data from GitHub */}

        <div className="total-issues-tables">
            <IssuesTable type="OPEN" />
            <IssuesTable type="CLOSED" />
        </div>

        <div className="issue-tracking-graphs">
            <IssueTrackingGraph type="PRIORITY" />
            <IssueTrackingGraph type="TYPE" />
        </div>
    </div>)
}

function IssuesTable({type}: {type: "OPEN" | "CLOSED"}) {
    const {report: r} = useContext(ReportContext)
    const id = "issues_"+type
    if (!r) return null
    const lastVal = r.metadata[id+"_last"]
    const thisVal = r.metadata[id+"_this"]
    const percentageChange = ((thisVal-lastVal)/thisVal)*100
    const percentageChangeString = (percentageChange>0 ? "+" : "") + percentageChange.toFixed(0)+"%"
    return (
        <div className="vanilla-report-table">
        <table><tbody>
            <tr><th colSpan={3}>
                {type === "OPEN" 
                    ? `Issues open on ${dateToDateString(new Date(r.end_date))}`
                    : `Issues closed from ${dateToDateString(new Date(r.start_date))} to ${dateToDateString(new Date(r.end_date))}`
                }
                <p className="subtitle">{type === "OPEN"
                    ? "This is the number of unhandled issues left in total."
                    : "This is the number of issues that were handled this month."
                }</p>
                <br/>
            </th></tr>
            <tr>
                <th>Average</th>
                <th>Last Month</th>
                <th>This Month</th>
            </tr>
            <tr>
                <td><InputAuth id={id+"_average"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+"_last"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+"_this"} numericOnly defaultValue={0}/> ({percentageChangeString})</td>
            </tr>
        </tbody></table></div>
    )
}

function IssueTrackingGraph({type}: {type: "PRIORITY" | "TYPE"}) {
    const {permissions} = useContext(LoginContext)
    const {report: r, viewMode} = useContext(ReportContext)
    if (!r) return null
    
    const id = "issue_tracking_"+type+"_"
    const rows = type === "PRIORITY" ? ["Low-Priority", "Medium-Priority", "High-Priority"] : ["Enhancement", "Feature", "Bug"]
    const data = type === "PRIORITY" ? [
        {name: "Low-Priority", 
            "Average": r?.metadata[id+rows[0]+"_average"], 
            "Last Month": r?.metadata[id+rows[0]+"_last"], 
            "This Month": r?.metadata[id+rows[0]+"_this"]
        },
        {name: "Medium-Priority", 
            "Average": r?.metadata[id+rows[1]+"_average"], 
            "Last Month": r?.metadata[id+rows[1]+"_last"], 
            "This Month": r?.metadata[id+rows[1]+"_this"]
        },
        {name: "High-Priority", 
            "Average": r?.metadata[id+rows[2]+"_average"], 
            "Last Month": r?.metadata[id+rows[2]+"_last"], 
            "This Month": r?.metadata[id+rows[2]+"_this"]
        }
    ] : [
        { name: "Enhancement", 
            "Average": r?.metadata[id+rows[0]+"_average"], 
            "Last Month": r?.metadata[id+rows[0]+"_last"], 
            "This Month": r?.metadata[id+rows[0]+"_this"]
        },
        { name: "Feature", 
            "Average": r?.metadata[id+rows[1]+"_average"], 
            "Last Month": r?.metadata[id+rows[1]+"_last"], 
            "This Month": r?.metadata[id+rows[1]+"_this"]
        },
        { name: "Bug", 
            "Average": r?.metadata[id+rows[2]+"_average"], 
            "Last Month": r?.metadata[id+rows[2]+"_last"], 
            "This Month": r?.metadata[id+rows[2]+"_this"]
        }
    ]

    const colourTypes: ("Average" | "Last Month" | "This Month")[] = ["Average", "Last Month", "This Month"]
    const colours = type === "PRIORITY" ? {
        "Average": [chartGreenDark, chartYellowDark, chartRedDark],
        "Last Month": [chartGreenMed, chartYellowMed, chartRedMed],
        "This Month": [chartGreenLight, chartYellowLight, chartRedLight]
    } : {
        "Average": [chartBlueDark, chartGreenDark, chartRedDark],
        "Last Month": [chartBlueMed, chartGreenMed, chartRedMed],
        "This Month": [chartBlueLight, chartGreenLight, chartRedLight]
    }


    const writeAccess = (permissions.includes(managePermission) && !viewMode);
    return (<div className="issue-tracking-graph">
        <div className="vanilla-report-table vanilla-editor-table" style={!writeAccess ? {display: "none"} : undefined}>
        <table><tbody>
            <tr><th colSpan={4}>
                {type === "PRIORITY" ? "Distribution of Priorities for Open Issues" : "Distribution of Type for Open Issues"}
                <br/>
            </th></tr>
            <tr>
                <th></th>
                <th>Average</th>
                <th>Last Month</th>
                <th>This Month</th>
            </tr>
            <tr>
                <th>{rows[0]}</th>
                <td><InputAuth id={id+rows[0]+"_average"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[0]+"_last"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[0]+"_this"} numericOnly defaultValue={0}/></td>
            </tr>
            <tr>
                <th>{rows[1]}</th>
                <td><InputAuth id={id+rows[1]+"_average"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[1]+"_last"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[1]+"_this"} numericOnly defaultValue={0}/></td>
            </tr>
            <tr>
                <th>{rows[2]}</th>
                <td><InputAuth id={id+rows[2]+"_average"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[2]+"_last"} numericOnly defaultValue={0}/></td>
                <td><InputAuth id={id+rows[2]+"_this"} numericOnly defaultValue={0}/></td>
            </tr>
        </tbody></table></div>

        <div className="issue-tracking-graph"><ResponsiveContainer width={"90%"} height={250}>
        <BarChart 
            data={data} 
        >
            <Bar name="Hours Worked" dataKey="duration" fill={chartBlueMed} width={700}/>
            <XAxis 
                dataKey="name"
                tickMargin={7}
            />
            <YAxis allowDecimals={false}/>
            {colourTypes.map(key => (
                <Bar key={key} dataKey={key} name={key}>
                {data.map((entry, index) => (
                    <Cell key={`cell-${key}-${index}`} fill={colours[key][index]} />
                ))}
                </Bar>
            ))}
            <Tooltip 
                labelFormatter={label => label}
                formatter={(value: number) => value}
                separator=": "
                cursor={false}
            />
        </BarChart>
        </ResponsiveContainer></div></div>
    )
}