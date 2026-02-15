import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import {
    editableProductProps,
    ProductEditorContext
} from "../../../../components/productPropertyEditor/editableProductProps.ts";
import "./productTable.css"
import React, {useContext, useEffect, useState} from "react";
import Tooltip from "../../../../components/tooltip/tooltip.tsx";
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../../lib/supabaseRPC.tsx";
import {openObjectInNewTab} from "../../../../lib/lib.tsx";
import {ProductContext} from "../../../products/lib.tsx";
import {compareProductTableHeaderKeys, ProductTableContext} from "../lib.ts";
import DoubleClickEditableProdPropBox
    from "../../../../components/productPropertyEditor/doubleClickEditableProdPropBox.tsx";
import {getRepresentativeImage} from "@shared/functions/images.ts";
import {SquareImageBox} from "../../../../components/squareImageBox/squareImageBox.tsx";
import {getProductPagePath} from "../../../../lib/paths.ts";
import {TableContext} from "./lib.ts";

export default function ProductTable() {
    /** Fetch new data from the remote on the given product, updating the page with the most up-to-date information. */
    async function fetchNewProductData(prod: UnsubmittedProductData) {
        const new_prod = await getProducts(supabase, [prod.sku], false, false)
        setParentProd(new_prod[0])
    }

    /** Set the data of the given product in the product list */
    function setProduct(prod: UnsubmittedProductData) {
        setParentProd(prod)
    }

    const {setProd: setParentProd, groupsState, columnsState} = useContext(ProductTableContext)
    const [groups] = groupsState

    const keys = columnsState ? Object
            .keys(columnsState[0])
            .filter(k => {
                const key = k as keyof typeof editableProductProps
                return columnsState[0][key]
            })
            .sort(compareProductTableHeaderKeys)
        : []
    const displayNames = keys.map(
        propName => editableProductProps[propName as keyof typeof editableProductProps]?.displayName
    )
    const sortSelectedState = useState<keyof typeof editableProductProps>("sku")

    // Keep track of the widths of columns to ensure collapsed subtables line up correctly.
    const [colWidths, setColWidths] = useState<number[]>([])
    // Update columns once after waiting a fair amount of time after page load, fallbacks are in place in case this doesn't work
    useEffect(()=>{setTimeout(updateColWidths, 500)})
    function updateColWidths() {
        const row = document.getElementsByClassName("single")[0] as HTMLTableRowElement;
        const newWidths: number[] = []
        if (!row) return;
        for (let i=0; i<row.children.length; i++) {
            const td = row.children[i] as HTMLTableCellElement
            newWidths.push(td.getBoundingClientRect().width)
        }
        setColWidths(newWidths)
    }

    return <TableContext value={{colWidths, updateColWidths}}><div id="product-table">
        <table>
            <thead>
            <tr>
                <td>
                    <div>{editableProductProps["sku"].displayName}
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
                    return (<td key={i}>
                        <div>
                            {col}
                            <Tooltip msg={props?.tooltip}/>
                            <SortOrderButton
                                propName={keys[i] as keyof typeof editableProductProps}
                                sortSelectedState={sortSelectedState}
                            />
                        </div>
                    </td>)
                })}
            </tr>
            </thead>

            <tbody>
            {groups.map((group, i) =>
                <TableRow
                    group={group} i={i} fetchNewProductData={fetchNewProductData} setProduct={setProduct} key={i}
                />
            )}
            </tbody>

        </table>
    </div></TableContext>
}

function TableRow(
    {group, i, fetchNewProductData, setProduct, isSubTable = false}: {
        group: UnsubmittedProductData[],
        i: number,
        fetchNewProductData: (prod: UnsubmittedProductData) => Promise<void>,
        setProduct: (prod: UnsubmittedProductData) => void
        isSubTable?: boolean
    }
) {
    if (!group || group.length == 0) return <tr></tr>

    const {originalGroups, propLists, columnsState} = useContext(ProductTableContext)
    const keys = columnsState ? Object
            .keys(columnsState[0])
            .filter(k => {
                const key = k as keyof typeof editableProductProps
                return columnsState[0][key]
            })
            .sort(compareProductTableHeaderKeys)
        : []
    const image = getRepresentativeImage(group)
    const prod = group[0]

    const {colWidths, updateColWidths} = useContext(TableContext)

    useEffect(() => {
        const el = document.getElementById(`group-${prod.sku}`)
        if (!el) return
        function handler(){updateColWidths()}
        el.addEventListener('shown.bs.collapse', handler)
        return () => {
            el.removeEventListener('shown.bs.collapse', handler)
        }
    }, [prod.sku])

    if (group.length === 1) { // ============= SINGLE PRODUCTS =============
        return <tr className="single">
            <td style={isSubTable ? {minWidth: colWidths[0]} : undefined}>{prod.sku}</td>
            <td style={isSubTable ? {minWidth: colWidths[1]} : undefined}>
                <a href={getProductPagePath(prod.sku)}><SquareImageBox image={image} size={"50px"} hoverable/></a>
            </td>
            <ProductContext.Provider value={{
                product: prod,
                originalProd: originalGroups[i][0],
                setProduct,
                group: [prod],
                hoveredVariant: prod
            }}>
                <ProductEditorContext.Provider value={{
                    propLists, fetchNewData: async () => {
                        await fetchNewProductData(prod)
                    }
                }}>
                    {keys.map((k, i) => {
                        // Skip some since they're defined manually.
                        if (["sku"].includes(k)) return;
                        const key = k as keyof typeof editableProductProps;
                        return <td key={i + k} style={isSubTable ? {minWidth: colWidths[i+1]} : undefined}>
                            <DoubleClickEditableProdPropBox propName={key}/>
                        </td>
                    })}</ProductEditorContext.Provider>
            </ProductContext.Provider>
            <td className="spacer-table-field"/>
            <td><button onClick={() => openObjectInNewTab(group)}>View JSON</button></td>
        </tr>
    } else { // ============= GROUPED PRODUCTS =============
        return (<><tr
            className="group"
            data-bs-toggle="collapse"
            data-bs-target={`#group-${prod.sku}`}
        >
            <td></td>
            <td><a href={getProductPagePath(group[0].sku)}><SquareImageBox image={image} size={"50px"} hoverable/>
            </a></td>
            <td id={"name"}>{prod.group_name}</td>
            <td className={"spacer-table-field"} colSpan={keys.length-1}/>
            <td><button onClick={() => openObjectInNewTab(group)}>View JSON</button></td>
        </tr>

        <tr className="hiddenRow">
            <td colSpan={keys.length+3}>
                <div className="accordion-body collapse" id={`group-${prod.sku}`}>
                    <table id="product-table">
                        <tbody>
                            {group.map((prod, index) => <TableRow
                                key={index}
                                group={[prod]}
                                i={i}
                                fetchNewProductData={fetchNewProductData}
                                setProduct={setProduct}
                                isSubTable
                            />)}
                        </tbody>
                    </table>
                </div>
            </td>
        </tr>
        </>)
    }
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