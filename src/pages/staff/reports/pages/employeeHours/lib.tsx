import {useEffect, useState} from "react"
import {getJWTToken} from "../../../../../lib/auth"
import {ReportData} from "../../types"

export type UserDailyHours = {
    /** ID of the user this datapoint refers to */
    userID: string
    /** Array of durations for this day, one for each user that worked on this day */
    durations: DailyHours
}

export type DailyHours = {
    /** Day that this datapoint refers to, as an ISO date string */
    day: string
    /** The amount of time this user worked, in milliseconds */
    duration: number
    /** The amount of pay this user earned on this day, in minor currency units */
    pay: number
}[]

export function useGetClockifyHours(report: ReportData, clockifyUsers: string[]) {
    const [resp, setResp] = useState<UserDailyHours[]>([])
    useEffect(() => {
        async function get() {
            const response = await fetch(window.origin + "/.netlify/functions/getClockifyData", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${await getJWTToken()}`
                },
                body: JSON.stringify({
                    clockifyUsers,
                    start: (new Date(report.start_date)).toISOString(),
                    end: (new Date(report.end_date)).toISOString()
                })
            }) 
            const entries = await response.json()
            setResp(entries)
        }
        get()
    }, [])
    return resp
}

export function getTotalPay(hrs: DailyHours): number {
    let pay = 0
    hrs.forEach(hr => pay+=hr.pay)
    return pay
}

export function getTotalHours(hrs: DailyHours): number {
    let time = 0
    hrs.forEach(hr => time+=hr.duration)
    return time
}

export function getPayRate(hrs: DailyHours): number {
    for (let i=0; i<hrs.length; i++) {
        const hr = hrs[i]
        if (hr.duration > 0) return (hr.pay)/(hr.duration/3.6e+6);
    }
    return 0
}