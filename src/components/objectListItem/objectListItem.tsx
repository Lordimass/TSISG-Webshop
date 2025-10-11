import { JSX, useState } from "react"

import "./objectListItem.css"

/**
 * Renders a list vertically, with content inside specified by a custom component
 * @param style The style of box to render
 * @param dropdown Content to include in a drop down menu
 * @param className Additional class to apply to the item
 * @param toggleDropdownFunction Ref to set to method to allow the parent component to 
 * trigger the dropdown externally
 * @param hideDropdownToggles Whether to hide the "expand"/"collapse" dropdown toggles, 
 * useful in conjunction with `setTogDropdownFunction`
 */
export default function ObjectListItem({
    children, style, dropdown, className, toggleDropdownFunction,
    hideDropdownToggles = false
} : {
    children?: JSX.Element[] | JSX.Element
    style?: "red" | "yellow" | "green"
    dropdown?: JSX.Element
    className?: string
    toggleDropdownFunction?: React.RefObject<(() => void) | undefined>
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