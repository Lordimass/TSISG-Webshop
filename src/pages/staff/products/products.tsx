import AuthenticatedPage from "../../../components/page/authenticatedPage.tsx";
import {useGetProducts} from "../../../lib/supabaseRPC.tsx";
import {PageSelector} from "../../../components/ticker/pageSelector/pageSelector.tsx";
import {useEffect, useRef, useState} from "react";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import ProductTable from "./productTable.tsx";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {cleanseUnsubmittedProduct} from "../../products/lib.tsx";
import {compareProductByKey, productFilters, ProductTableContext} from "./lib.ts";
import {fetchPropAutofillData} from "../../../components/productPropertyEditor/lib.ts";
import {editableProductProps} from "../../../components/productPropertyEditor/editableProductProps.ts";

import "./products.css"
import ProductsFilter from "./filters.tsx";

export default function Products() {
    /** Set the data of the given product in the product list */
    function setProduct(prod: UnsubmittedProductData) {
        setProds([
            ...prods.filter(
                k => k.sku !== prod.sku
            ),
            cleanseUnsubmittedProduct(prod)
        ].sort(compare.current))
    }

    /** Sort the products in order of a given key */
    function sort(key: keyof typeof editableProductProps, reverse: boolean = false) {
        console.log(`Sort by ${key}`)
        compare.current = (a: UnsubmittedProductData, b: UnsubmittedProductData) => compareProductByKey(a,b, key, reverse)
        setProds((prods.sort(compare.current)));

        setProdsOnPage(prods.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? []);
    }

    function applyFilters(ps: ProductData[]) {
        Object.keys(filters).forEach(key => {
            if (filters[key].value === "Hide") {
                ps = ps.filter(p => !filters[key].filter(p))
            }
        })
        return ps
    }

    const compare = useRef(
        (a: UnsubmittedProductData, b: UnsubmittedProductData) => compareProductByKey(a,b, "sku")
    )

    // Fetch prop lists
    const [propLists, setPropLists] = useState<Awaited<ReturnType<typeof fetchPropAutofillData>>>()
    useEffect(() => {
        async function fetch() {
            setPropLists(await fetchPropAutofillData());
        }
        fetch().then()
    }, [])

    // Handle filtering
    const [filters, setFilters] = useState(productFilters);

    // Fetch all products and sort by SKU
    const getProdsResp = useGetProducts(undefined, false, false);
    const [prods, setProds] = useState<ProductData[]>([])
    useEffect(() => {
        if (!getProdsResp.data) return
        const filteredProds = applyFilters(getProdsResp.data);
        setProds(filteredProds.sort(compare.current) ?? [])
    }, [getProdsResp.loading, filters]);

    // Separate products into pages
    const PRODS_PER_PAGE = 20;
    const [prodsOnPage, setProdsOnPage] = useState<(ProductData | UnsubmittedProductData)[]>([]);
    const originalProdsOnPage = useRef<ProductData[]>([])
    const [page, setPage] = useState(1);
    const pageSelector = <PageSelector
        id={"product-table-page-selector"}
        pageCount={Math.ceil(prods.length/PRODS_PER_PAGE)}
        onChange={setPage}
    />

    useEffect(() => {
        originalProdsOnPage.current = prods.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? [];
        setProdsOnPage(prods.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? []);
    }, [page, prods, filters]);

    return (<AuthenticatedPage requiredPermission={"edit_products"} id={"staff-products"}>
        <ProductTableContext.Provider value={{
            setProd: setProduct,
            originalProds: originalProdsOnPage.current,
            prodsState: [prodsOnPage, setProdsOnPage],
            propLists, sort,
        }}>
            <div className="top-bar">
                <ProductsFilter filterStates={[filters, setFilters]}/>
                {pageSelector}
            </div>

            <ProductTable/>
            {pageSelector}
        </ProductTableContext.Provider>
    </AuthenticatedPage>)
}