import {Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis} from "recharts"
import "./employeeHours.css"
import {chartBlueMed} from "../../consts";
import {useContext} from "react";
import {ReportContext} from "../../report/lib";
import {getPayRate, getTotalHours, getTotalPay, useGetClockifyHours, UserDailyHours} from "./lib";
import {dateToDateString, durationToDurationString} from "../../../../../lib/lib";
import {SiteSettingsContext} from "../../../../../app";
import ReportSubtitle from "../../components/reportSubtitle";

export default function EmployeeHours() {
    const {rRef} = useContext(ReportContext)
    const r = rRef?.current
    if (!r) return

    // TODO: Allow manage_reports to add or remove userIDs to display hours for.
    const clockifyUsers = r.metadata.clockifyUserIDs ?? ["687560d15adda104676f32d2", "67fe148f4c444a224b798195"]
    const clockifyHours = useGetClockifyHours(r, clockifyUsers)

    return <div id="report-employee-hours-page" className="report-page">
        <ReportSubtitle><h2>Employee Hours</h2></ReportSubtitle>
        <div className="employee-hours-charts">
            {clockifyHours.map((hrs, i) => <HoursChart userDailyHours={hrs} key={i}/>)}
        </div>
    </div>
}

function HoursChart({userDailyHours}: {userDailyHours: UserDailyHours}) {
    // Check Name
    let name = "UNKNOWN"
    const siteSettings = useContext(SiteSettingsContext)
    if (siteSettings.clockify_users) {
        const matchedUsers = siteSettings.clockify_users.filter(
            (usr) => usr.userID === userDailyHours.userID
        )
        if (matchedUsers.length > 0) name = matchedUsers[0].name
    }

    return (<div className="report-employee-hours-graph">
    <h2>{name} - Distribution of work</h2>
    <ResponsiveContainer width={"90%"} height={250}>
    <BarChart 
        data={userDailyHours.durations} 
    >
        <Bar name="Hours Worked" dataKey="duration" fill={chartBlueMed} width={700}/>
        <XAxis 
            dataKey="day"
            tickFormatter={val => dateToDateString(new Date(val), true)}
            tickMargin={7}
            interval={"preserveStartEnd"}
            minTickGap={30}
        />
        <YAxis 
            dataKey="duration" 
            tickFormatter={(val) => (val/(3.6e+6)).toFixed(0)+" hrs"} 
            interval={"preserveStart"}
            ticks={[0, (3.6e+6), (3.6e+6)*2, (3.6e+6)*3, (3.6e+6)*4, (3.6e+6)*5, (3.6e+6)*6]}
            domain={([_min, max]) => [0, Math.max(max+(1e+6), 4e+6)]}
        />
        <Tooltip 
            labelFormatter={label => dateToDateString(new Date(label))}
            formatter={(value: number) => durationToDurationString(value)}
            separator=": "
        />
    </BarChart>
    </ResponsiveContainer>
    <div className="vanilla-report-table">
    <table><tbody>
        <tr>
            <th>Total Hours Worked</th>
            <td>{durationToDurationString(getTotalHours(userDailyHours.durations))}</td>
        </tr><tr>
            <th>Pay Rate</th>
            <td>£ {(getPayRate(userDailyHours.durations)/100).toFixed(2)}</td>
        </tr><tr>
            <th>Total Pay</th>
            <td>£ {(getTotalPay(userDailyHours.durations)/100).toFixed(2)}</td>
        </tr>
    </tbody></table></div>
    </div>)
}