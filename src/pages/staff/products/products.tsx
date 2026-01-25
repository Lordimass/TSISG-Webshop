import AuthenticatedPage from "../../../components/page/authenticatedPage.tsx";
import {useGetProducts} from "../../../lib/supabaseRPC.tsx";
import {PageSelector} from "../../../components/ticker/pageSelector/pageSelector.tsx";
import {useEffect, useState} from "react";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import ProductTable from "./productTable.tsx";

export default function Products() {
    // Fetch all products and sort by SKU
    const getProdsResp = useGetProducts(undefined, false, false);
    const prods = getProdsResp.data?.sort((a, b) => a.sku - b.sku) ?? []

    // Separate products into pages
    const PRODS_PER_PAGE = 20;
    const [prodsOnPage, setProdsOnPage] = useState<ProductData[]>([]);
    const [page, setPage] = useState(1);
    const pageSelector = <PageSelector
        id={"product-table-page-selector"}
        pageCount={Math.ceil(prods.length/PRODS_PER_PAGE)}
        onChange={setPage}
    />

    useEffect(() => {
        setProdsOnPage(prods.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? []);
    }, [page, prods]);

    return (<AuthenticatedPage requiredPermission={"edit_products"}>
        {pageSelector}
        <ProductTable prods={prodsOnPage}/>
        {pageSelector}
    </AuthenticatedPage>)
}