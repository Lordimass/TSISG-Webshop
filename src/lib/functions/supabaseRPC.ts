import {type MinimalProductImage, ProductCollection, ProductData, ProductGroup, SUPABASE_STORAGE} from "@/lib";
import type {SupabaseClient} from "@supabase/supabase-js";
import type {IToast} from "@/lib/types/toasts.ts";

/**
 * @param supabase The Supabase client to call the function with.
 * Safe call of `SupabaseClient.rpc` with the option to notify users when something goes wrong. It's recommended
 * that you wrap this function with other functions for each Postgres function you want to call, e.g. a `getProducts`
 * function which wraps `callRPC("get_products", {})`, and returns [`ProductData[]`]{@link ProductData} for type safety.
 * @param functionName The name of the Postgres function to call.
 * @param params Any parameters for the function.
 * @param toast A method with which to notify the user if something goes wrong.
 */
export async function callRPC(
    supabase: SupabaseClient,
    functionName: string,
    params?: { [key: string]: any },
    toast?: (toast: IToast | string) => void,
): Promise<any> {
    // Check that the client exists
    if (!supabase) {
        console.error("`supabase` was not defined.");
        if (toast) {
            toast(
                `An error occurred while calling the "${functionName}" function because the Supabase client was not defined"`,
            );
        }
        return undefined;
    }

    // Call the function and handle any errors
    const { data, error } = await supabase.rpc(functionName, params);
    if (error) {
        console.error(`Error calling RPC function "${functionName}":`, error);
        if (toast)
            toast(
                `An error occurred while calling the "${functionName}" function. Please try again later.`,
            );
        return Promise.reject(error);
    } else {
        return data;
    }
}

export async function getProducts(
    supabase: SupabaseClient,
    ids?: string[],
    in_stock_only = false,
    livemode = true,
    tags?: string[],
    toast?: (toast: IToast | string) => void,
): Promise<ProductData[]> {
    // TODO: Change this to get TSISG Products
    const products: any[] = await callRPC(
        supabase,
        "gm_get_products",
        {ids, in_stock_only, p_livemode: livemode, p_tags: tags},
        toast
    );

    return handleGetProductsResponse(products);
}

export async function getGroupedProducts(
    supabase: SupabaseClient,
    ids?: string[],
    in_stock_only = false,
    livemode = true,
    tags?: string[],
    toast?: (toast: IToast | string) => void,
): Promise<ProductCollection> {
    // TODO: Change this to get TSISG Products
    const groups: any[][] = await callRPC(
        supabase,
        "gm_get_grouped_products",
        {ids, in_stock_only, p_livemode: livemode, p_tags: tags},
        toast
    );

    return handleGetGroupedProductsResponse(groups);
}

export function handleGetProductsResponse(respData: any[] | undefined): ProductData[] {
    if (!respData) return [];

    return respData.map((p: any) => {
        let images: MinimalProductImage[] = p.images.map((img: any) => {
            let uri = `${SUPABASE_STORAGE}/${img.bucket_id}`;
            img.path_tokens.forEach((token: string) => (uri += "/" + token));
            return {
                ...img,
                display_order: img.display_order,
                alt: img.user_metadata?.alt,
                uri,
            };
        });
        if (!images || images.length == 0) {
            images = p.stripe_images.map((uri: string) => {
                return {uri};
            });
        }
        const opts = {
            ...p,
            ...p.metadata,
            images,
            price: (p.price.unit_amount ?? 0) / 100,
            priceId: p.price.id,
            groupName: p.group_name,
        };

        delete opts.metadata;

        return new ProductData(p.id, opts);
    }) satisfies ProductData[];
}

export function handleGetGroupedProductsResponse(respData: any[][] | undefined): ProductCollection {
    if (!respData) return new ProductCollection();

    const collection = new ProductCollection();
    collection.push(...respData.map((g) => new ProductGroup(handleGetProductsResponse(g))));
    return collection;
}
