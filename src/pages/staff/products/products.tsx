import AuthenticatedPage from "../../../components/page/authenticatedPage.tsx";
import {useGetProducts} from "../../../lib/supabaseRPC.tsx";
import {PageSelector} from "../../../components/ticker/pageSelector/pageSelector.tsx";
import {useEffect, useRef, useState} from "react";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import ProductTable from "./productTable.tsx";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";

export default function Products() {
    // Fetch all products and sort by SKU
    const getProdsResp = useGetProducts(undefined, false, false);
    const [prods, setProds] = useState<ProductData[]>([])
    useEffect(() => {
        setProds(getProdsResp.data?.sort((a, b) => a.sku - b.sku) ?? [])
    }, [getProdsResp.loading]);

    // Separate products into pages
    const PRODS_PER_PAGE = 50;
    const prodsOnPageState = useState<(ProductData | UnsubmittedProductData)[]>([]);
    const setProdsOnPage = prodsOnPageState[1];
    const originalProdsOnPage = useRef<ProductData[]>([])
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
        originalProdsOnPage.current = prods.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? [];
    }, [page, prods]);

    return (<AuthenticatedPage requiredPermission={"edit_products"}>
        {pageSelector}
        <ProductTable prodsState={prodsOnPageState} originalProds={originalProdsOnPage.current} />
        {pageSelector}
    </AuthenticatedPage>)
}