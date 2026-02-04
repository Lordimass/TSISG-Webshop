import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {
    editableProductProps,
    ProductEditorContext
} from "../../../components/productPropertyEditor/editableProductProps.ts";
import "./productTable.css"
import React, {useEffect, useState} from "react";
import Tooltip from "../../../components/tooltip/tooltip.tsx";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";
import {compareProductsBySku} from "../../../lib/sortMethods.tsx";
import {openObjectInNewTab} from "../../../lib/lib.tsx";
import {ProductContext} from "../../products/lib.tsx";
import {compareProductTableHeaderKeys} from "./lib.tsx";
import {fetchPropAutofillData} from "../../../components/productPropertyEditor/lib.ts";
import DoubleClickEditableProdPropBox
    from "../../../components/productPropertyEditor/doubleClickEditableProdPropBox.tsx";

export default function ProductTable({prodsState, originalProds, setParentProd}: {
    /** Products to display in the table */
    prodsState: [UnsubmittedProductData[], (prods: UnsubmittedProductData[]) => void]
    /** Method to set a product in the full, unfiltered list of products in the parent component */
    setParentProd?: (p: UnsubmittedProductData) => void;
    /** Original products before any edits were made */
    originalProds: ProductData[]
}) {

    /** Set the data of the given product in the product list */
    function setProduct(prod: UnsubmittedProductData) {
        setProds([
            ...prods.filter(
                k => k.sku !== prod.sku
            ),
            prod
        ].sort(compareProductsBySku))
        if (setParentProd) setParentProd(prod)
    }

    /** Fetch new data from the remote on a specific product, updating the page with the most up-to-date information. */
    async function fetchNewProductData(prod: UnsubmittedProductData) {
        const new_prod = await getProducts(supabase, [prod.sku], false, false)
        setProds([
            ...prods.filter(
                k => k.sku !== prod.sku
            ),
            new_prod[0]
        ].sort(compareProductsBySku))
        if (setParentProd) setParentProd(new_prod[0])
    }

    // Fetch prop lists
    const [propLists, setPropLists] = useState<Awaited<ReturnType<typeof fetchPropAutofillData>>>()
    useEffect(() => {
        async function fetch() {
            setPropLists(await fetchPropAutofillData());
        }
        fetch().then()
    }, [])

    const keys = Object.keys(editableProductProps).sort(compareProductTableHeaderKeys)
    const displayNames = keys.map(
        propName => editableProductProps[propName as keyof typeof editableProductProps]?.displayName
    )

    const [prods, setProds] = prodsState

    return <div id="product-table">
        <table>
            <thead>
            <tr>
                {displayNames.map((col, i) => {
                    const props = editableProductProps[
                        keys[i] as keyof typeof editableProductProps
                        ];
                    return (<td key={i}>
                        {col}
                        <Tooltip msg={props?.tooltip}/>
                    </td>)
                })}
            </tr>
            </thead>

            <tbody>
            {prods.map((prod, i) => <tr key={i}>
                {keys.map((key) => {
                    const typedKey = key as keyof typeof editableProductProps;
                    switch (typedKey) {
                        case "sku":
                            return (<td key={key}>{prod.sku}</td>)
                    }
                    return <td key={i+key}>
                        <ProductContext.Provider value={{
                            product: prod,
                            originalProd: originalProds[i],
                            setProduct,
                            group: [prod],
                            hoveredVariant: prod
                        }}>
                        <ProductEditorContext.Provider value={{
                            propLists, fetchNewData: async () => {await fetchNewProductData(prod)}
                        }}>
                            <DoubleClickEditableProdPropBox propName={typedKey}/>
                        </ProductEditorContext.Provider></ProductContext.Provider>
                    </td>
                })}
                <td><button onClick={() => openObjectInNewTab(prod)}>View JSON</button></td>
            </tr>)}
            </tbody>

        </table>
    </div>
}