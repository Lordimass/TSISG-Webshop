import {Context} from "@netlify/functions";
import {UUID} from "crypto";
import {UserResponse} from "@supabase/supabase-js";
import {supabaseService} from "../lib/getSupabaseClient.ts";

interface BodyParams {
    /** User ID of the user to fetch the email of */
    uid: UUID;
}

/**
 * Fetch the email associated with a user, given their ID.
 *
 * @endpoint POST /.netlify/functions/getSupabaseUserEmail
 */
export default async function handler(request: Request, _context: Context) {
    const body: BodyParams = await request.json();

    // Fetch from Supabase.
    const resp: UserResponse = await supabaseService.auth.admin.getUserById(body.uid)
    if (resp.error) {
        return new Response(JSON.stringify(resp.error), {status: 500});
    }

    const email = resp.data.user.email;

    // User had no email attached.
    if (!email) {
        return new Response(undefined, {status: 404});
    }

    // Email attached, return
    return new Response(email);
}