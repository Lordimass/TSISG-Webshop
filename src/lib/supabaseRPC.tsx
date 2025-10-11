import { useEffect, useState } from "react";
import { ProductData } from "./types";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_DATABASE_URL = import.meta.env.VITE_SUPABASE_DATABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY
export const supabase = createClient(SUPABASE_DATABASE_URL, SUPABASE_ANON_KEY)

export type UseRPCReturn<T> = {
    loading: boolean
    data?: T
    error?: Error
}

export async function callRPC(
    functionName: string, 
    params?: { [key: string]: any }, 
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
    params?: { [key: string]: any },
    notify?: (msg: string) => void
) : UseRPCReturn<any> {
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

export function useGetProducts(skus?: number[], in_stock_only = false, active_only = true
) : UseRPCReturn<ProductData[]> {
    return useCallRPC("get_products", {skus: skus || null, in_stock_only, active_only});
}
export async function getProducts(skus?: number[], in_stock_only = false, active_only = true
) : Promise<ProductData[]> {
    return await callRPC("get_products", {skus: skus || null, in_stock_only, active_only});
}

export function useGetGroupedProducts(skus?: number[], in_stock_only = false, active_only = true
) : UseRPCReturn<ProductData[][]> {
    return useCallRPC("get_grouped_products", {skus: skus || null, in_stock_only, active_only});
}
export async function getGroupedProducts(skus?: number[], in_stock_only = false, active_only = true
) : Promise<ProductData[][]> {
    return await callRPC("get_grouped_products", {skus: skus || null, in_stock_only, active_only});
}