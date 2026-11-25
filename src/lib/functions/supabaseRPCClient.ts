import {ProductCollection, ProductData} from "@/lib";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {IToast} from "@/lib/types/toasts.ts";
import {handleGetGroupedProductsResponse, handleGetProductsResponse} from "@/lib/functions/supabaseRPC.ts";
import {useCallRPC} from "@/lib/supabase/client.ts";

export function useGetProducts(
    supabase: SupabaseClient,
    skus?: (string | number)[],
    in_stock_only = false,
    tags?: string[],
    toast?: (toast: IToast | string) => void,
): ProductData[] {
    return handleGetProductsResponse(useCallRPC(
        supabase,
        "get_products",
        {skus, in_stock_only, p_tags: tags},
        toast
    ).data);
}

export function useGetGroupedProducts(
    supabase: SupabaseClient,
    skus?: (string | number)[],
    in_stock_only = false,
    tags?: string[],
    toast?: (toast: IToast | string) => void,
): ProductCollection {
    return handleGetGroupedProductsResponse(useCallRPC(
        supabase,
        "get_grouped_products",
        {skus, in_stock_only, p_tags: tags},
        toast
    ).data);
}