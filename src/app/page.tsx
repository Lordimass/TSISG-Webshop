import React from "react";
import HomePageTitle from "@/app/HomePageTitle.tsx";
import {getGroupedProducts} from "@/lib/functions/supabaseRPC.ts";
import {createClient} from "@/lib/supabase/server.ts";
import Products from "@/components/Product/Products/Products.tsx";


export default async function Page() {
    // TODO: Products
    // TODO: public/_redirects
    // TODO: Glow Me! Redirects

    const supabase = await createClient()
    const prods = await getGroupedProducts(supabase);

    return <>
        <HomePageTitle/>

        <Products prods={prods.serialise()} pageSize={30}/>
    </>
}