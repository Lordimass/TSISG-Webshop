import {editableProductProps} from "./editableProductProps.ts";
import React, {useContext, useEffect, useRef, useState} from "react";
import {ProductContext} from "../../pages/products/lib.tsx";
import {useParsedPropertyString} from "./lib.ts";
import {ProdPropEditor} from "./editableProdPropBox.tsx";

import "./doubleClickEditableProdPropBox.css"
import {LoginContext} from "../../app.tsx";

/** A product property field which can be double-clicked to display the editor for the property instead. */
export default function DoubleClickEditableProdPropBox(
    {propName}: {propName: keyof typeof editableProductProps}
) {
    // Change to edit mode on double click.
    function handleDoubleClick() {
        if (!editable) return;
        const newEditMode = !editMode
        setEditMode(newEditMode);
        // Focus the text area.
        if (newEditMode) {
            requestAnimationFrame(()=>{
                const textArea = containerRef.current!.getElementsByTagName("textarea")[0]
                textArea.focus()
                textArea.setSelectionRange(textArea.textLength, textArea.textLength);
            })
        }
    }

    const {product} = useContext(ProductContext)
    const string = useParsedPropertyString(propName, product)
    const [editMode, setEditMode] = useState<boolean>(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Set edit mode to false when the product changes. Prevents unpredictable behaviour when product on editor changes.
    useEffect(() => {
        setEditMode(false);
    }, [product]);

    // Exit edit mode when clicking outside the box
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (!containerRef.current!.contains(e.target as Node)) setEditMode(false)
        }
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    // Set edit permissions
    const [editable, setEditable] = useState(false);
    const loginContext = useContext(LoginContext)
    useEffect(() => {
        const newEditable = editableProductProps[propName]!.permission ?
            loginContext.permissions.includes(editableProductProps[propName]!.permission) :
            loginContext.permissions.includes("edit_products")
        if (!newEditable) setEditMode(false)
        setEditable(newEditable)
    }, [loginContext])

    return <div
        onDoubleClick={handleDoubleClick}
        className="double-click-editable-prod-prop"
        ref={containerRef}
    >
        {editMode
            ? <ProdPropEditor propName={propName} showName={false} shouldAutoResizeTextArea={false}/>
            : <p>{string}</p>
        }
    </div>
}