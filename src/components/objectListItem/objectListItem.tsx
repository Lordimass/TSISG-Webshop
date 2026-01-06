import React, { JSX, useState } from "react"

import "./objectListItem.css"

/** Renders a list vertically, with content inside specified by a custom component */
export default function ObjectListItem({
    children, style, dropdown, className, toggleDropdownFunction,
    hideDropdownToggles = false
} : {
    children?: JSX.Element[] | JSX.Element
    /** The style of box to render */
    style?: "red" | "yellow" | "green"
    /** Content to include in a drop-down menu */
    dropdown?: JSX.Element
    /** Additional class to apply to the item */
    className?: string
    /** Ref to set to method to allow the parent component to trigger the dropdown externally */
    toggleDropdownFunction?: React.RefObject<(() => void) | undefined>
    /** Whether to hide the "expand"/"collapse" dropdown toggles, useful in conjunction with `toggleDropdownFunction` */
    hideDropdownToggles?: boolean
}) {
    function togDropdown() {setDropdownActive(!dropdownActive);}
    if (toggleDropdownFunction) {toggleDropdownFunction.current = togDropdown;}
    
    const [dropdownActive, setDropdownActive] = useState(false)

    return (<div className={`object-list-item`}>
        <div className={`inner${style ? " "+style : ""}${className ? " "+className : ""}`}>
            {children}
            {dropdown && !hideDropdownToggles 
                ? <button className="expand" onClick={togDropdown}>
                    {dropdownActive ? "collapse" : "expand"}
                </button> 
                : null}
        </div>
        {dropdown && dropdownActive ? 
            <div className="dropdown">
                {dropdown}
                {!hideDropdownToggles ? <button className="expand" onClick={togDropdown}>collapse</button> :  null}
            </div> 
        : null}
    </div>)
}