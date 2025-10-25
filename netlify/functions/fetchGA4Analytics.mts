import { Context } from "@netlify/functions";
import { getSupabaseUserPermissions } from "../lib/getSupabaseClient.mts";
import getBetaAnalyticsDataClient from "../lib/betaAnalyticsDataClient.mts";

/**
 * Returns a list with an object containing information about the duration of
 * time worked by each userID, for each day in between `start` and `end` (inclusive).
 * @param start A time string which relates to the start of the first day in the period
 * @param end A time string which relates to the start of the last day in the period
 * @returns `{day: Date, durations: {userID: string, duration: string}[]}[]`
 */
export default async function handler(request: Request, _context: Context) {try{
    const perms = await getSupabaseUserPermissions(request)
    if (!perms.includes("view_reports")) return new Response(undefined, {status: 403})
    
    //let {start, end} = await request.json()
    const client = await getBetaAnalyticsDataClient();
    const [response] = await client.runReport({
        property: "properties/487921084",
        dateRanges: [{ startDate: "7daysAgo", endDate: "today"}],
        metrics: [{name: "sessions"}],
        dimensions: [{name: "date"}]
    });

    return new Response(JSON.stringify(response))

} catch(e: any) {console.error(e); return new Response(e.message, {status: e.status ?? 500})}}