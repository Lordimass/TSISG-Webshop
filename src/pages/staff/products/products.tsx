import AuthenticatedPage from "../../../components/page/authenticatedPage.tsx";
import {useGetGroupedProducts} from "../../../lib/supabaseRPC.tsx";
import {PageSelector} from "../../../components/ticker/pageSelector/pageSelector.tsx";
import {useEffect, useRef, useState} from "react";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import ProductTable from "./productTable/productTable.tsx";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {cleanseUnsubmittedProduct} from "../../products/lib.tsx";
import {
    compareProductGroupsByKey,
    compareProductsByKey,
    productFilters,
    ProductTableContext,
    selectedColumns
} from "./lib.ts";
import {fetchPropAutofillData} from "../../../components/productPropertyEditor/lib.ts";
import {editableProductProps} from "../../../components/productPropertyEditor/editableProductProps.ts";

import "./products.css"
import ProductsFilter from "./filters/filters.tsx";
import ProductTableColumnsChoice from "./columns/columns.tsx";

export default function Products() {
    /** Set the data of the given product in the product list */
    function setProduct(prod: UnsubmittedProductData) {
        // Find associated group and set product within it.
        let newGroups = [...groups];
        for (let i=0; i<groups.length; i++) {
            const group = groups[i];
            const indexInGroup = group.findIndex(p => p.sku === prod.sku)
            if (indexInGroup !== -1) {
                newGroups[i][indexInGroup] = cleanseUnsubmittedProduct(prod);
            }
        }
        newGroups = newGroups.map(g => g.sort(compare.current))
        setGroups(newGroups.sort(compareGrps.current));
    }

    /** Sort the products in order of a given key */
    function sort(key: keyof typeof editableProductProps, reverse: boolean = false) {
        compareGrps.current = (a: UnsubmittedProductData[], b: UnsubmittedProductData[]) => compareProductGroupsByKey(a,b, key, reverse)
        compare.current = (a: UnsubmittedProductData, b: UnsubmittedProductData) => compareProductsByKey(a,b, key, reverse)
        const newGroups = groups.map(g => g.sort(compare.current))
        setGroups(newGroups.sort(compareGrps.current));
        setProdsOnPage(groups.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? []);
    }
    const compareGrps = useRef((
        a: UnsubmittedProductData[],
        b: UnsubmittedProductData[]
    ) => compareProductGroupsByKey(a,b, "sku")
    )
    const compare = useRef((
        a: UnsubmittedProductData,
        b: UnsubmittedProductData
    ) =>
        compareProductsByKey(a,b, "sku")
    )

    /** Apply the current filters to the product list */
    function applyFilters(groups: ProductData[][]) {
        Object.keys(filters).forEach(key => {
            if (filters[key].value === "Hide") {
                groups = groups
                    .map(group => group.filter(p => !filters[key].filter(p)))
                    .filter(group => group.length > 0)
            }
        })
        return groups
    }

    // Fetch prop lists
    const [propLists, setPropLists] = useState<Awaited<ReturnType<typeof fetchPropAutofillData>>>()
    useEffect(() => {
        async function fetch() {setPropLists(await fetchPropAutofillData());}
        fetch().then()
    }, [])

    // Fetch all products and sort by SKU
    const getProdsResp = useGetGroupedProducts(undefined, false, false);
    const [groups, setGroups] = useState<ProductData[][]>([])
    const [filters, setFilters] = useState(productFilters);
    useEffect(() => {
        if (!getProdsResp.data) return
        const filteredProds = applyFilters(getProdsResp.data);
        setGroups(filteredProds.sort(compareGrps.current) ?? [])
    }, [getProdsResp.loading, filters]);

    // Separate products into pages
    const PRODS_PER_PAGE = 20;
    const [prodsOnPage, setProdsOnPage] = useState<(ProductData | UnsubmittedProductData)[][]>([]);
    const originalProdsOnPage = useRef<ProductData[][]>([])
    const [page, setPage] = useState(1);
    const pageSelector = <PageSelector
        id={"product-table-page-selector"}
        pageCount={Math.ceil(groups.length/PRODS_PER_PAGE)}
        onChange={setPage}
    />

    // Choose columns to display
    const columnsState = useState(selectedColumns)

    useEffect(() => {
        originalProdsOnPage.current = groups.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? [];
        setProdsOnPage(groups.slice(
            PRODS_PER_PAGE*(page-1),
            PRODS_PER_PAGE*page
        ) ?? []);
    }, [page, groups, filters]);

    return (<AuthenticatedPage requiredPermission={"edit_products"} id={"staff-products"}>
        <ProductTableContext.Provider value={{
            setProd: setProduct,
            originalGroups: originalProdsOnPage.current,
            groupsState: [prodsOnPage, setProdsOnPage],
            propLists, sort, columnsState
        }}>
            <div className="top-bar">
                <div className="top-bar-left">
                    <ProductsFilter filterStates={[filters, setFilters]}/>
                    <ProductTableColumnsChoice/>
                </div>
                {pageSelector}
            </div>

            <ProductTable/>
            {pageSelector}
        </ProductTableContext.Provider>
    </AuthenticatedPage>)
}