import React, {useContext, useEffect, useRef, useState} from "react";
import {EditableProductProp, editableProductProps, ProductEditorContext} from "./editableProductProps.ts";
import {ProductData} from "@shared/types/supabaseTypes.ts";
import {cleanseUnsubmittedProduct, ProductContext} from "../../pages/products/lib.tsx";
import {updateProductData} from "../../lib/netlifyFunctions.tsx";
import {LoginContext} from "../../lib/auth.tsx";
import {NotificationsContext} from "../notification/lib.tsx";
import {AutocompleteInput, MultiAutocomplete} from "../autocompleteInput/autocompleteInput.tsx";
import Tooltip from "../tooltip/tooltip.tsx";

import "./productPropertyEditor.css"
import {autoResizeTextarea, useParsedPropertyString} from "./lib.ts";

/** The editor for a single property of a single product. Must be wrapped in `ProductEditorContext` */
export function ProdPropEditor({propName, showName = true, shouldAutoResizeTextArea = true, autoFocus = false}: {
    /** The name of the property that this editor controls */
    propName: keyof typeof editableProductProps;
    /** If truthy, the component will include the name of the property, as well as a tooltip. Defaults to `true`. */
    showName?: boolean
    /** Whether text area should automatically resize to fit their content. Defaults to `true`. */
    shouldAutoResizeTextArea?: boolean;
    /** Whether text area should be put in focus when the component renders. Defaults to `false` */
    autoFocus?: boolean;
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
        if (!params || !prodContext.setProduct) return;

        // Use default constraint for the property if not supplied
        constraint = constraint ?? params.constraint

        /**
         * Parse the new value into the given product at the given key, using defined parsers.
         * @param key The key of ProductData to assign `val` to.
         * @param val The new value to assign to `target[key]`
         * @param target The target product to perform the operation to.
         */
        async function parseValueIntoObj<K extends keyof ProductData>(
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
            await params.updateProductOverride(value, editorContext, prodContext);
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
        if (textArea.current) textArea.current.value = await params.toStringParser(newProduct)
        // Update on Supabase
        await updateProductData(newProduct)
        // Fetch new data to update anything else that changed (last_edited, last_edited_by, etc.)
        if (editorContext.fetchNewData) await editorContext.fetchNewData()
    }

    const [loginContext, {notify}, editorContext, prodContext] = [
        useContext(LoginContext),
        useContext(NotificationsContext),
        useContext(ProductEditorContext),
        useContext(ProductContext)
    ]
    const prod = prodContext.product
    const textArea = useRef<HTMLTextAreaElement | null>(null);

    const params = editableProductProps[propName] as EditableProductProp<typeof propName>;
    if (!params) throw new Error(`No product prop defined for ${propName}.`)

    // Set edit permissions
    const [editable, setEditable] = useState(false);
    useEffect(() => {
        params.permission ?
            setEditable(loginContext.permissions.includes(params.permission)) :
            setEditable(loginContext.permissions.includes("edit_products"))
    }, [loginContext])

    const stringParsedValue = useParsedPropertyString(propName, prod)

    // Auto-resize text field when value is updated by anything.
    useEffect(
        () => {if (textArea.current && shouldAutoResizeTextArea) autoResizeTextarea(textArea.current)},
        [textArea.current]
    );

    useEffect(() => {
        if (textArea.current && autoFocus) textArea.current?.focus()
    }, []);

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
                ? <NoAutoCompleteTextArea editable={editable} defaultValue={stringParsedValue} propName={propName} shouldAutoResizeTextArea={shouldAutoResizeTextArea} ref={textArea} />
                : params.autocompleteMode === "SINGLE" && editorContext.propLists?.[propName]
                ? <AutocompleteInput values={editorContext.propLists[propName]} defaultValue={stringParsedValue} id={`${propName}-editor-input`} ref={textArea}/>
                : params.autocompleteMode === "MULTI" && editorContext.propLists?.[propName]
                ? <MultiAutocomplete values={editorContext.propLists[propName]} defaultValue={stringParsedValue} id={`${propName}-editor-input`} ref={textArea}/>
                : null
            }
            {params.postfix ? <p>{params.postfix}</p> : <></>}
        </div>

        <PropButtons propName={propName} updateProduct={updateProduct} textArea={textArea} editable={editable} />
    </div>)
}

/** Submission and reset buttons */
function PropButtons({propName, updateProduct, textArea, editable}: {
    propName: keyof typeof editableProductProps;
    updateProduct: (value?: any, constraint?: (value: string) => boolean) => Promise<void>,
    textArea: React.RefObject<HTMLTextAreaElement | null>,
    editable: boolean,
}
) {
    function eq() {
        return (params.toStringParser(originalProd) ?? "") !== (textArea.current?.value ?? "")
    }

    const params = editableProductProps[propName] as EditableProductProp<typeof propName>;
    const {originalProd} = useContext(ProductContext)

    const [isEdited, setIsEdited] = useState<boolean>(eq())
    useEffect(() => {
        if (!editable) {setIsEdited(false); return}
        if (textArea.current) {
            textArea.current.onfocus = () => setIsEdited(true)
            textArea.current.onblur = () => setIsEdited(eq())
            textArea.current.onkeyup = () => setIsEdited(eq())
        }
    }, [originalProd, textArea.current]);

    useEffect(() => {
        if (!editable) {setIsEdited(false); return}
        setIsEdited(eq())
    }, [originalProd, textArea.current?.value]);

    return <div className="prop-buttons" style={{display: isEdited ? "flex" : "none"}}>
        <button
            className="update-prop-button"
            onClick={() => updateProduct()}
        >✔
        </button>
        <button
            className="reset-prop-button"
            onClick={() => {
                updateProduct(
                    params.toStringParser(originalProd),
                    () => true // Always allow, since we're resetting to an old value.
                ).then()
            }}
        >⟳
        </button>
    </div>
}

function NoAutoCompleteTextArea(
    {editable, propName, defaultValue, ref, shouldAutoResizeTextArea}:
    {
        editable: boolean,
        propName: keyof ProductData,
        defaultValue?: string,
        ref: React.RefObject<HTMLTextAreaElement | null>
        shouldAutoResizeTextArea: boolean
    }
) {
    return <textarea
        className="prop-editor-input"
        id={propName.toString() + "-editor-input"}
        defaultValue={defaultValue}
        onInput={(e) => {if (shouldAutoResizeTextArea) autoResizeTextarea(e.currentTarget)}}
        disabled={!editable}
        ref={ref}
    />
}