import {ProductData} from "@shared/types/supabaseTypes.ts";
import {SupabaseClient} from "@supabase/supabase-js";
import {supabase} from "../../src/lib/supabaseRPC.tsx";
import {logValidationErrors, VALIDATORS} from "@shared/schemas/schemas.ts";

export async function callRPC(
    functionName: string,
    supabase: SupabaseClient,
    params?: { [key: string]: any },
    notify?: (msg: string) => void,
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

export async function getProducts(supabase: SupabaseClient, skus?: number[], in_stock_only = false, active_only = true
): Promise<ProductData[]> {
    const prods = await callRPC(
        "get_products",
        supabase,
        {skus: skus || null, in_stock_only, active_only}
    );
    if (!VALIDATORS.ProductData(prods[0])) { // Checking the first item is enough since they'll all be the same shape
        console.warn("Fetched products not in expected shape 'ProductData'")
        console.log(prods[0].images)
        logValidationErrors("ProductData");
    }
    return prods;
}