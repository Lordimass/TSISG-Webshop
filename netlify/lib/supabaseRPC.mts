import { SupabaseClient } from "@supabase/supabase-js";

export async function callRPC(
    functionName: string, 
    params: { [key: string]: any }, 
    supabase: SupabaseClient
): Promise<any> {
    const {data, error} = await supabase.rpc(functionName, params);
    if (error) {
        console.error(`Error calling RPC function "${functionName}":`, error);
        return Promise.reject(error);
    } else {
        return data;
    }
}