import {createBrowserClient} from '@supabase/ssr'
import {SupabaseClient, type User} from "@supabase/supabase-js";
import {useEffect, useState} from "react";
import type {IToast} from "@/lib/types/toasts.ts";
import {callRPC} from "@/lib/functions/supabaseRPC.ts";

export function createClient(): SupabaseClient | null {
    if (!process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return null
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_DATABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
}

export function useGetUser(supabase: SupabaseClient) {
    const [user, setUser] = useState<User | null>(null);
    useEffect(() => {
        async function checkLoggedIn() {
            const {data: {user}, error: getUserError} = await supabase.auth.getUser();
            if (getUserError) throw getUserError;
            setUser(user);
        }
        checkLoggedIn().then();
    }, []);
    return user;
}

export async function login(email: string, password: string) {
    const supabase = createClient()!;
    console.log("Get User ", await supabase.auth.getUser())
    const {data: emailExists, error: emailCheckError} = await supabase.rpc("email_exists", {email_to_check: email})
    if (emailCheckError) {console.error(emailCheckError); return;}
    if (emailExists) {
        const {data: signInData, error: signInError} = await supabase.auth.signInWithPassword({email, password})
        if (!signInError) {
            console.log("Sign in successful: ", signInData)
            console.log("Get User ", await supabase.auth.getUser())
            return {...signInData, newAccount: false}
        } else {
            console.error("Something went wrong signing in: ", signInError)
            throw signInError
        }
    } else {
        const {data: signUpData, error: signUpError} = await supabase.auth.signUp({email, password})
        if (!signUpError) {
            console.log("Sign up successful: ", signUpData)
            return {...signUpData, newAccount: true}
        } else {
            console.error("Something went wrong signing up: ", signUpError)
            throw signUpError
        }
    }
}

export async function logout() {
    const supabase = createClient()!;
    await supabase.auth.signOut();
}


/**
 * The return type of {@link useCallRPC}. Contains 3 properties:
 * - `loading` - Whether the request is still loading
 * - `data` - The data returned from the request, if any. Will be `undefined` until the request is done loading or if
 * there is an error.
 * - `error` - Any error that occurred while calling the function. `undefined` if there are no errors.
 */
export interface UseRPCReturn<T> {
    loading: boolean;
    data?: T;
    error?: Error;
}

/**
 * React hook wrapper for {@link callRPC}. It's recommended that you wrap this function with other functions for each
 * Postgres function you want to call, e.g. a `useGetProducts` function which wraps `useCallRPC("get_products", {})`,
 * and returns {@link UseRPCReturn | `UseRPCReturn<ProductData>`} for type safety.
 *
 * @param supabase The Supabase client to call the function with.
 * @param functionName The name of the Postgres function to call.
 * @param params Any parameters for the function.
 * @param toast A method with which to notify the user if something goes wrong.
 * @returns A {@link UseRPCReturn | `UseRPCReturn`} object containing 3 React states indicating the status of the RPC call.
 */
export function useCallRPC(
    supabase: SupabaseClient,
    functionName: string,
    params?: { [key: string]: any },
    toast?: (toast: IToast | string) => void,
): UseRPCReturn<any> {

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(undefined);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await callRPC(supabase, functionName, params, toast);
                setData(result);
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData().then();
    }, []);

    return { loading, data, error };
}