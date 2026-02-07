import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {
    editableProductProps,
    ProductEditorContext
} from "../../../components/productPropertyEditor/editableProductProps.ts";
import "./productTable.css"
import React, {useContext, useEffect, useState} from "react";
import Tooltip from "../../../components/tooltip/tooltip.tsx";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";
import {compareProductsBySku} from "../../../lib/sortMethods.tsx";
import {openObjectInNewTab} from "../../../lib/lib.tsx";
import {ProductContext} from "../../products/lib.tsx";
import {compareProductTableHeaderKeys, ProductTableContext} from "./lib.tsx";
import DoubleClickEditableProdPropBox
    from "../../../components/productPropertyEditor/doubleClickEditableProdPropBox.tsx";
import {getRepresentativeImage} from "@shared/functions/images.ts";
import {SquareImageBox} from "../../../components/squareImageBox/squareImageBox.tsx";
import {getProductPagePath} from "../../../lib/paths.ts";

export default function ProductTable() {
    /** Fetch new data from the remote on the given product, updating the page with the most up-to-date information. */
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

    const keys = Object.keys(editableProductProps).sort(compareProductTableHeaderKeys)
    const displayNames = keys.map(
        propName => editableProductProps[propName as keyof typeof editableProductProps]?.displayName
    )
    const sortSelectedState = useState<keyof typeof editableProductProps>("sku")

    const {setProd: setParentProd, prodsState} = useContext(ProductTableContext)
    const [prods, setProds] = prodsState

    return <div id="product-table">
        <table>
            <thead>
            <tr>
                <td><div>{editableProductProps["sku"].displayName}
                    <Tooltip msg={editableProductProps["sku"].tooltip}/>
                    <SortOrderButton
                        propName="sku"
                        sortSelectedState={sortSelectedState}
                    /></div>
                </td>
                <td></td>
                {displayNames.map((col, i) => {
                    if (i === 0) return; // Skip SKU since that's defined manually
                    const props = editableProductProps[
                        keys[i] as keyof typeof editableProductProps];
                    return (<td key={i}><div>
                        {col}
                        <Tooltip msg={props?.tooltip}/>
                        <SortOrderButton
                            propName={keys[i] as keyof typeof editableProductProps}
                            sortSelectedState={sortSelectedState}
                        />
                    </div></td>)
                })}
            </tr>
            </thead>

            <tbody>
            {prods.map((prod, i) =>
                <TableRow
                    prod={prod} i={i} fetchNewProductData={fetchNewProductData} setProduct={setProduct}
                />
            )}
            </tbody>

        </table>
    </div>
}

function TableRow({prod, i, fetchNewProductData, setProduct}: {
    prod: UnsubmittedProductData,
    i: number,
    fetchNewProductData: (prod: UnsubmittedProductData) => Promise<void>,
    setProduct: (prod: UnsubmittedProductData) => void}
) {

    const keys = Object.keys(editableProductProps).sort(compareProductTableHeaderKeys)
    const {originalProds, propLists} = useContext(ProductTableContext)
    const image = getRepresentativeImage(prod)

    return <tr key={i}>
        <td>{prod.sku}</td>
        <td><a href={getProductPagePath(prod.sku)}><SquareImageBox image={image} size={"50px"} hoverable/></a></td>
        <ProductContext.Provider value={{
            product: prod,
            originalProd: originalProds[i],
            setProduct,
            group: [prod],
            hoveredVariant: prod
        }}><ProductEditorContext.Provider value={{
            propLists, fetchNewData: async () => {
                await fetchNewProductData(prod)
            }
        }}>
            {keys.map((key) => {
                // Skip some since they're defined manually.
                if (["sku"].includes(key)) return;
                const typedKey = key as keyof typeof editableProductProps;
                return <td key={i + key}>
                    <DoubleClickEditableProdPropBox propName={typedKey}/>
                </td>
            })}</ProductEditorContext.Provider></ProductContext.Provider>
        <td>
            <button onClick={() => openObjectInNewTab(prod)}>View JSON</button>
        </td>
    </tr>
}

function SortOrderButton({propName, sortSelectedState}: {
    propName: keyof typeof editableProductProps
    sortSelectedState: [keyof typeof editableProductProps, (propName: keyof typeof editableProductProps) => void]
}) {
    function handleClick() {
        let newIsReversed = isReversed
        if (isSelected) {
            newIsReversed = !newIsReversed
            setIsReversed(newIsReversed)
        }
        sortSelectedState[1](propName)
        sort(propName, newIsReversed)
    }
    const {sort} = useContext(ProductTableContext)
    const isSelected = sortSelectedState[0] === propName;
    const [isReversed, setIsReversed] = useState(false)

    useEffect(() => { // Reset isReversed
        if (!isSelected) setIsReversed(false)
    }, [sortSelectedState[0]]);

    return <button className={`sort-order-button${isSelected ? " selected" : ""}`} onClick={handleClick}>
        {isReversed
            ? <i className="fi fi-sr-angle-small-up"/>
            : <i className={"fi fi-sr-angle-small-down"}/>
        }

    </button>
}