import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {editableProductProps, ProductEditorContext} from "../../products/productEditor/editableProductProps.ts";
import "./productTable.css"
import React from "react";
import {compareProductTableHeaderKeys} from "./lib.tsx";
import Tooltip from "../../../components/tooltip/tooltip.tsx";
import {ProdPropEditor} from "../../products/productEditor/editableProdPropBox.tsx";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";

export default function ProductTable({prodsState, originalProds}: {
    /** Products to display in the table */
    prodsState: [(ProductData | UnsubmittedProductData)[], React.Dispatch<React.SetStateAction<(ProductData | UnsubmittedProductData)[]>>]
    /** Original products before any edits were made */
    originalProds: ProductData[]
}) {
    /** Fetch new data from the remote, updating the page with the most up-to-date information. */
    async function fetchNewData(prod: ProductData | UnsubmittedProductData) {
        const response = await getProducts(supabase, [prod.sku])
        if (setProduct) setProduct(response[0])
        //setPropLists(await fetchPropAutofillData());
    }
    /** Set the data of the given product in the product list */
    function setProduct(prod: ProductData | UnsubmittedProductData) {
        setProds([
            ...prods.filter(
                k => k.sku !== prod.sku
            ),
            prod
        ])
    }

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
            {prods.map((prod, i) => (<tr key={i}>
                {keys.map((key) => {
                    const typedKey = key as keyof typeof editableProductProps;
                    switch (typedKey) {
                        case "sku":
                            return (<td key={key}>{prod.sku}</td>)
                    }
                    return <td key={key}>
                        <ProductEditorContext value={{
                            originalProd: originalProds[i],
                            product: prod,
                            setProduct
                        }}><ProdPropEditor propName={typedKey} showName={false} shouldAutoResizeTextArea={false}/>
                        </ProductEditorContext>
                    </td>
                })}
            </tr>))}
            </tbody>

        </table>
    </div>
}