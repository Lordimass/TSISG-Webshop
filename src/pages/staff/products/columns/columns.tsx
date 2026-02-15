import {useContext} from "react";
import {compareProductTableHeaderKeys, ProductTableContext} from "../lib.ts";
import {DropdownButton, DropdownItemText} from "react-bootstrap";
import {editableProductProps} from "../../../../components/productPropertyEditor/editableProductProps.ts";
import Tooltip from "../../../../components/tooltip/tooltip.tsx";

import "./columns.css"

export default function ProductTableColumnsChoice() {
    const {columnsState} = useContext(ProductTableContext);
    if (!columnsState) return null
    const keys = Object.keys(columnsState[0]).sort(compareProductTableHeaderKeys)

    return <DropdownButton title={"Columns"} className="columns-dropdown" autoClose={false}>
        {keys.map(k => {
            const key = k as keyof typeof editableProductProps
            const prop = editableProductProps[key]
            return (<DropdownItemText key={k} className="column-selector">
                <div>{prop?.displayName}<Tooltip msg={prop?.tooltip}/></div>
                <div className="spacer"/>
                <input
                    type={"checkbox"}
                    checked={columnsState[0][key]}
                    onChange={e => {
                        const newCols = {...columnsState[0]}
                        newCols[key] = e.target.checked
                        columnsState[1](newCols)
                    }}
                />
            </DropdownItemText>)
        })}
    </DropdownButton>
}