import { useEffect, useState } from "react";
import { supabase } from "../app";

export type UseRPCReturn = {
    loading: boolean
    data?: any
    error?: Error
}

export async function callRPC(
    functionName: string, 
    params: { [key: string]: any }, 
    notify?: (msg: string) => void
): Promise<any> {
    const {data, error} = await supabase.rpc(functionName, params);
    if (error) {
        console.error(`Error calling RPC function "${functionName}":`, error);
        if (notify) notify(`An error occurred while calling the "${functionName}" function. Please try again later.`);
        return Promise.reject(error);
    } else {
        return data;
    }
}

export function useCallRPC(
    functionName: string, 
    params: { [key: string]: any },
    notify?: (msg: string) => void
) : UseRPCReturn {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(undefined);
    const [error, setError] = useState<Error | undefined>(undefined);

    useEffect(() => {
        async function fetchData() {
            try {
                const result = await callRPC(functionName, params, notify);
                setData(result);
            } catch (err: any) {
                setError(err);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return {loading, data, error};
}

export function useGetProducts(skus?: string[]) : UseRPCReturn {
    return useCallRPC("get_products", {skus: skus || null});
}