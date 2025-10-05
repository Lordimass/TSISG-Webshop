import { JSX, useState } from "react"

import "./objectListItem.css"

/**
 * Renders a list vertically, with content inside specified by a custom component
 */
export default function ObjectListItem({
    children, style, dropdown, className
} : {
    children?: JSX.Element[]
    /** The style of box to render */
    style?: "red" | "yellow" | "green"
    /** Content to include in a drop down menu */
    dropdown?: JSX.Element
    /** Additional class to apply to the item */
    className?: string
}) {
    function togDropdown() {setDropdownActive(!dropdownActive)}

    const [dropdownActive, setDropdownActive] = useState(false)

    return (<div className={`object-list-item ${className ?? ""}`}>
        <div className={`inner ${style ?? ""}`}>
            {children}
            {dropdown 
                ? <button className="expand" onClick={togDropdown}>
                    {dropdownActive ? "collapse" : "expand"}
                </button> 
                : null}
        </div>
        {dropdown && dropdownActive ? 
            <div className="dropdown">
                {dropdown}
                <button className="expand" onClick={togDropdown}>collapse</button>
            </div> 
        : null}
    </div>)
}