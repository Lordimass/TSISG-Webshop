import { Context } from "@netlify/functions";
import type { TimeEntry } from "@shared/types/clockifyTypes.ts";
import { parseDuration } from "../lib/lib.ts"
import { getSupabaseUserPermissions } from "../lib/getSupabaseClient.ts";

type Body = {
    /** A list of Clockify User IDs*/
    clockifyUsers: string[],
    /** A time string which relates to the start of the first day in the period */
    start: string,
    /** A time string which relates to the start of the last day in the period */
    end: string
};
type IDsEntries = {userID: string, entries: TimeEntry[]}
type DayDurations = {userID: string, durations: {day: number, duration: number, pay: number}[]}

/**
 * Returns a list with an object containing information about the duration of
 * time worked by each userID, for each day in between `start` and `end` (inclusive).
 * @see Body
 * @returns `{day: Date, durations: {userID: string, duration: string}[]}[]`
 */
export default async function handler(request: Request, _context: Context) {try{
    const perms = await getSupabaseUserPermissions(request)
    if (!perms.includes("view_reports")) return new Response(undefined, {status: 403})
    
    let {clockifyUsers, start, end} = await request.json() as Body
    end = (new Date(Date.parse(end)+8.64e+7)).toISOString()
    const responses: IDsEntries[] = []
    const days = (Date.parse(end) - Date.parse(start))/8.64e+7

    // Fetch time entries in range for each provided userID
    for (let i=0; i<clockifyUsers.length; i++) {
        // Construct endpoint with query string parameters
        const userID = clockifyUsers[i]
        let endpoint = new URL(
            `https://api.clockify.me/api/v1/workspaces/${process.env.CLOCKIFY_WORKSPACE_ID}/user/${userID}/time-entries`
        )
        endpoint.searchParams.set("start", start)
        endpoint.searchParams.set("end", end)
        endpoint.searchParams.set("page-size", ""+days*5)

        // Set API Key Header
        const headers: HeadersInit = new Headers();
        headers.set("x-api-key", process.env.CLOCKIFY_KEY!);

        // Fetch from Clockify Servers
        const response = await fetch(endpoint, {headers})
        if (response.ok) {
            const data = await response.json()
            responses.push({userID, entries: data})
        } else {
            throw await response.json()
        }
    }
    // Convert the list of time entries into an object containing a total duration for each day of the period.
    return new Response(JSON.stringify(convertToDailyHours(responses, start, end)))

} catch(e: any) {console.error(e); return new Response(e.message, {status: e.status ?? 500})}}

/** 
 * Takes time entries mapped with user IDs over a given period of days, 
 * and calculates the time covered by those entries for each day in
 * the period.
*/
function convertToDailyHours(entriesLists: IDsEntries[], start: string, end: string): DayDurations[] {
  const dayDurations: DayDurations[] = [];

  const startDate = new Date(start);
  const endDate = new Date(end);

  // Align to UTC midnight for day buckets
  const startMilli = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate());
  const endMilli = Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), endDate.getUTCDate()-1);

  entriesLists.forEach(entriesList => {
    const userID = entriesList.userID;
    const durations: {day: number; duration: number; pay: number}[] = [];

    for (let t = startMilli; t <= endMilli; t += 86400000) {
      const tomorrow = t + 86400000;
      let duration = 0;
      let pay = 0

      entriesList.entries.forEach(entry => {
        const s = entry.timeInterval?.start ? Date.parse(entry.timeInterval.start) : NaN;
        const e = entry.timeInterval?.end ? Date.parse(entry.timeInterval.end) : Date.now();
        if (Number.isNaN(s) || Number.isNaN(e)) return;

        const overlap = Math.max(0, Math.min(e, tomorrow) - Math.max(s, t));
        duration += overlap;
        pay += (overlap/3.6e+6)*entry.hourlyRate.amount
      });

      durations.push({day: t, duration, pay});
    }

    dayDurations.push({ userID, durations });
  });

  return dayDurations;
}