import {GenericSingleProduct} from "@shared/types/productTypes.ts";
import {EditableProductProp, editableProductProps} from "../../products/productEditor/editableProductProps.ts";
import "./productTable.css"
import React from "react";
import {compareProductTableHeaderKeys} from "./lib.tsx";

export default function ProductTable({prods}: {
    /** Products to display in the table */
    prods: GenericSingleProduct[]
}) {
    const keys = Object.keys(editableProductProps).sort(compareProductTableHeaderKeys)
    const displayNames = keys.map(
        propName => editableProductProps[propName as keyof typeof editableProductProps]?.displayName
    )

    return <div id="product-table">
        <table>
            <thead>
            <tr>
                {displayNames.map((col, i) => {
                    const props = editableProductProps[keys[i] as keyof typeof editableProductProps];
                    return (<td key={i}>
                        {col}
                        <Tooltip props={props} />
                    </td>)})}
            </tr>
            </thead>
            <tbody>
            {prods.map((prod, i) => (<tr key={i}>
                {keys.map((key, i) => {
                    const typedKey = key as keyof GenericSingleProduct
                    return <td key={i}>{editableProductProps[typedKey]?.toStringParser(prod)}</td>
                })}
            </tr>))}
            </tbody>
        </table>
    </div>
}

function Tooltip({props}: {props?: EditableProductProp<any>}) {
    return (props?.tooltip
        ? (
            <span className="superscript tooltipable">
            [?]
            <span className="tooltip">{props.tooltip}</span>
            </span>
        )
        : <></>)
}