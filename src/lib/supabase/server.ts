"use server";

import {createServerClient} from "@supabase/ssr";
import {cookies} from "next/headers";
import {createClient as createSupabaseClient, SupabaseClient, type User} from "@supabase/supabase-js";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    }
                    catch {
                        // If it's running in a Server Component, just ignore
                    }
                },
            },
        }
    );
}

export async function createServiceRoleClient() {
    return createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
        process.env.SUPABASE_SECRET_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        }
    );
}

export async function getUser(supabase: SupabaseClient) {
    const {data: {user}, error: getUserError} = await supabase.auth.getUser();
    if (getUserError && getUserError.name === "AuthSessionMissingError") return null;
    else if (getUserError) throw getUserError;
    return user;
}

export interface Profile {
    id: string;
    name?: string;
    role: string;
}
export async function getUserProfile(supabase: SupabaseClient): Promise<Profile | null> {
    const user: User | null = await getUser(supabase);
    if (!user) return null;
    const {data, error} = await supabase.from("profiles")
        .select("*")
        .eq("id", user.id)
    ;
    if (error) throw error;
    return data.length > 0 ? data[0] : null;
}

export async function logout() {
    const supabase = await createClient();
    await supabase.auth.signOut();
}

export async function getMfaUser(supabase: SupabaseClient) {
    const {data: {session}, error: getSessionError} = await supabase.auth.getSession();
    if (getSessionError || !session) return null;

    const {data: assurance, error: assuranceError} = await supabase.auth.mfa
        .getAuthenticatorAssuranceLevel(session.access_token);
    if (assuranceError || assurance.currentLevel !== "aal2") return null;

    return getUser(supabase);
}