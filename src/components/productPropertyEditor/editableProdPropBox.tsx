import React, {useContext, useEffect, useRef, useState} from "react";
import {EditableProductProp, editableProductProps, ProductEditorContext} from "./editableProductProps.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {cleanseUnsubmittedProduct} from "../../pages/products/lib.tsx";
import {updateProductData} from "../../lib/netlifyFunctions.tsx";
import {LoginContext} from "../../lib/auth.tsx";
import {NotificationsContext} from "../notification/lib.tsx";
import {AutocompleteInput, MultiAutocomplete} from "../autocompleteInput/autocompleteInput.tsx";
import {UnsubmittedProductData} from "@shared/types/productTypes.ts";
import Tooltip from "../tooltip/tooltip.tsx";

import "./productPropertyEditor.css"

/** The editor for a single property of a single product. Must be wrapped in `ProductEditorContext` */
export function ProdPropEditor({propName, showName = true, shouldAutoResizeTextArea = true}: {
    /** The name of the property that this editor controls */
    propName: keyof typeof editableProductProps;
    /** If truthy, the component will include the name of the property, as well as a tooltip. Defaults to `true`. */
    showName?: boolean
    /** Whether text area should automatically resize to fit their content. Defaults to `true`. */
    shouldAutoResizeTextArea?: boolean;
}) {
    /**
     * Updates the given product live on screen and internally within Supabase.
     * @param value A value to set the product property to, leave undefined to fetch from the text area automatically
     * @param constraint A boolean method which returns true if the value is valid, false if not. Leave undefined to
     * use the default constraint for the property.
     */
    async function updateProduct(
        value?: any,
        constraint?: (value: string) => boolean
    ) {
        if (!params || !editorContext.setProduct) return;

        // Use default constraint for the property if not supplied
        constraint = constraint ?? params.constraint

        /**
         * Parse the new value into the given product at the given key, using defined parsers.
         * @param key The key of ProductData to assign `val` to.
         * @param val The new value to assign to `target[key]`
         * @param target The target product to perform the operation to.
         */
        async function parseValueIntoObj<K extends keyof ProductData>( // Parse string to right type using mapped parser from productTypeMap
            key: K,
            val: string,
            target: ProductData
        ) {
            const parser = params?.fromStringParser as (val: string) => ProductData[K] | Promise<ProductData[K]>;
            if (parser) {
                target[key] = await parser(val);
            } else {
                // Fallback to raw string if no parser provided
                target[key] = val as ProductData[K]
            }
            return target
        }

        // Fetch value from text area if not provided already.
        if (!value && textArea.current) {
            value = textArea.current.value;
        } else if (!value && !textArea.current) {
            throw new Error(`Ref for TEXT_AREA for ${propName} is null.`);
        }

        // Run override if it exists
        if (params.updateProductOverride) {
            await params.updateProductOverride(value, editorContext);
            return;
        }

        // Check validity of input
        if (!constraint(value)) {
            notify(`Value for ${String(propName)} is invalid.`);
            return;
        }

        const newProduct: ProductData = cleanseUnsubmittedProduct({...prod})
        // Assign the changed value
        await parseValueIntoObj(propName, value, newProduct)
        // Update on Supabase
        await updateProductData(newProduct)
        if (textArea.current) textArea.current.value = params.toStringParser(newProduct)
        // Fetch new data to update anything else that changed (last_edited, last_edited_by, etc.)
        if (editorContext.fetchNewData) await editorContext.fetchNewData()
    }

    const loginContext = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)
    const editorContext = useContext(ProductEditorContext)
    const prod = editorContext.product
    const textArea = useRef<HTMLTextAreaElement | null>(null);

    const originalProd = useRef(editorContext.originalProd)

    const params = editableProductProps[propName] as EditableProductProp<typeof propName>;
    if (!params) throw new Error(`No product prop defined for ${propName}.`)
    const isEdited = params.toStringParser(originalProd.current) !== textArea.current?.value;
    if (prod.sku === 1 && propName === "name") console.log(isEdited, params.toStringParser(originalProd.current), textArea.current?.value)

    // Set edit permissions
    const [editable, setEditable] = useState(false);
    useEffect(() => {
        params.permission ?
            setEditable(loginContext.permissions.includes(params.permission)) :
            setEditable(loginContext.permissions.includes("edit_products"))
    }, [loginContext])

    // Auto-resize text field when value is updated by anything.
    useEffect(() => {
        if (textArea.current) {
            // Get the new displayable string to put in the text area
            textArea.current.value = params.toStringParser(prod)
            if (shouldAutoResizeTextArea) autoResizeTextarea(textArea.current)
        }
    }, [prod])

    return (<div className="editable-prop" id={`${propName}-editable-prop`}>
        {/* Property name and tooltip */}
        {showName ? <div className="editable-prop-title">
            {params.displayName}
            <Tooltip msg={params.tooltip}/>
        </div> : null}

        {/* Main input box for the property editor */}
        <div className="editable-prop-input-box">
            {params.prefix ? <p>{params.prefix}</p> : <></>}
            {
                params.autocompleteMode === "NONE" || !editorContext.propLists?.[propName]
                ? <NoAutoCompleteTextArea prod={prod} editable={editable} propName={propName} ref={textArea} shouldAutoResizeTextArea={shouldAutoResizeTextArea} />
                : params.autocompleteMode === "SINGLE" && editorContext.propLists?.[propName]
                ? <AutocompleteInput values={editorContext.propLists[propName]} defaultValue={params.toStringParser(prod)} id={`${propName}-editor-input`} ref={textArea}/>
                : params.autocompleteMode === "MULTI" && editorContext.propLists?.[propName]
                ? <MultiAutocomplete values={editorContext.propLists[propName]} defaultValue={params.toStringParser(prod)} id={`${propName}-editor-input`} ref={textArea}/>
                : null
            }
            {params.postfix ? <p>{params.postfix}</p> : <></>}
        </div>

        {/* Submission and reset buttons */}
        <div className="prop-buttons">
            <button
                className="update-prop-button"
                onClick={() => updateProduct()}
                disabled={!editable}
            >✔
            </button>
            <button
                className="reset-prop-button"
                onClick={() => {
                    updateProduct(
                        originalProd.current[propName],
                        () => true // Always allow, since we're resetting to an old value.
                    ).then()
                }}
                disabled={!editable}
            >⟳
            </button>
        </div>
    </div>)
}

function NoAutoCompleteTextArea(
    {editable, propName, prod, ref, shouldAutoResizeTextArea}:
    {
        editable: boolean,
        propName: keyof ProductData,
        prod: ProductData | UnsubmittedProductData,
        ref: React.RefObject<HTMLTextAreaElement | null>
        shouldAutoResizeTextArea: boolean
    }
) {
    return <textarea
        className="prop-editor-input"
        id={propName.toString() + "-editor-input"}
        defaultValue={prod[propName] ? prod[propName]?.toString() : "Error: Invalid Key Value"}
        onInput={(e) => {if (shouldAutoResizeTextArea) autoResizeTextarea(e.currentTarget)}}
        disabled={!editable}
        ref={ref}
    />
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
    if (el) {
        el.style.height = 'auto'; // Reset
        el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
    }
}