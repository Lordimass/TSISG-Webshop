import React, { ReactElement, useContext, useEffect, useRef, useState } from "react"
import { ProductData } from "@shared/types/types"
import {cleanseUnsubmittedProduct, fetchPropAutofillData} from "../lib"
import { openObjectInNewTab } from "../../../lib/lib"
import { LoginContext } from "../../../app"
import { updateTagsOverride } from "./updateProductOverrides"
import { ProductImageEditor } from "./imageEditor"
import { category_prod_prop, EditableProductPropContext, editableProductProps, tags_prod_prop } from "./editableProductProps"
import MultiAutocomplete, {AutocompleteInput} from "../../../components/autocompleteInput/autocompleteInput.tsx"

import "./productEditor.css"
import { prodPropParsers } from "./prodPropParsers"
import { fetchFromNetlifyFunction, updateProductData, useFetchFromNetlifyFunction } from "../../../lib/netlifyFunctions"
import { ProductContext } from "../lib"
import { NotificationsContext } from "../../../components/notification/lib"
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";
import {fetchColumnsFromTable} from "@shared/functions/supabase.ts";

export default function ProductEditor() {
    /**
     * Fetch new data from the remote, updating the page with the most up-to-date information.
     */
    async function fetchNewData() {
        const response = await getProducts(supabase, [product.sku])
        if (setProduct) setProduct(response[0])
        setPropLists(await fetchPropAutofillData());
    }

    const {product, setProduct, originalProd} = useContext(ProductContext)
    if (!product) return <></>

    // Fetch prop lists
    const [propLists, setPropLists] = useState<Awaited<ReturnType<typeof fetchPropAutofillData>>>()
    useEffect(() => {
        async function fetch() {
            setPropLists(await fetchPropAutofillData());
        }
        fetch()
    }, [])

    // Prep input fields to be updated on new data
    const [categoryInput, setCategoryInput] = useState<React.JSX.Element | undefined>()
    const [tagsInput, setTagsInput] = useState<React.JSX.Element | undefined>()
    useEffect(() => {
        setCategoryInput(
            <AutocompleteInput
                values={propLists ? propLists.categories.map(cat => cat.name) : []}
                defaultValue={product.category.name}
                id="category_id-editor-input"
            />)
        setTagsInput(
            <MultiAutocomplete
                values={propLists ? propLists.tags.map(tag => tag.name) : []}
                defaultValue={product.tags.map((tag: any) => tag.name).join(", ")}
                id="tags-editor-input"
            />)
    }, [product, propLists])

    return (<><div className="product-editor">
        <h2> Basic Product Data </h2>
        {/******************** Main property editors ********************/}
        <div className="product-editor-grid">
            {/* All standard text field properties */}
            {editableProductProps.map((productProp) => 
            <EditableProductPropContext.Provider 
                value={{product, setProduct, productProp, originalProd}} 
                key={String(productProp.propName)}
            >
                <EditableProdPropBox fetchNewData={fetchNewData}/>
            </EditableProductPropContext.Provider>)}
            
            {/* Category field editor */}
            <EditableProductPropContext.Provider value={{
                product,
                setProduct,
                productProp: category_prod_prop,
                originalProd
            }}>
                <EditableProdPropBox fetchNewData={fetchNewData} inputField={categoryInput}/>
            </EditableProductPropContext.Provider>

            {/* Tag field editor */}
            <EditableProductPropContext.Provider value={{
                product,  
                productProp: tags_prod_prop, 
                originalProd, 
                setProduct,
                updateProductOverride: updateTagsOverride
            }}>
                <EditableProdPropBox fetchNewData={fetchNewData} inputField={tagsInput}/>
            </EditableProductPropContext.Provider>
        </div>

        {/*********** Submission Buttons ***********/}
        <button 
            className="product-editor-function-button" 
            id="refresh-data-button" 
            onClick={fetchNewData}
        >
            Refresh Data
        </button>
        <button 
            className="product-editor-function-button" 
            id="open-json-button" 
            onClick={() => openObjectInNewTab(product)}
        >
            Open JSON
        </button>
    </div>
    
    {/******************** Image Editing ********************/}
    <ProductImageEditor fetchNewData={fetchNewData} />
    </>)
}

function EditableProdPropBox({fetchNewData, inputField}: {fetchNewData: () => Promise<void>, inputField?: ReactElement}) {
    /**
     * Updates the given product live on screen and internally within Supabase.
     * @param key A keyof the product type as a string. The key of the value to change
     * @param value The new value to map the key to. Automatically parsed to the right type for the given key
     * @param constraint A boolean method which returns true if the value is valid, false if not.
     */
    async function updateProduct(key: keyof ProductData, value: any, constraint: (value: string) => boolean) {
        // Run override if it exists
        if (updateProductOverride) {
            await updateProductOverride(key, value, originalProd, fetchNewData, constraint);
            return;
        }

        async function assignTypedValue<K extends keyof ProductData>( // Parse string to right type using mapped parser from productTypeMap
            key: K,
            val: string,
            target: Partial<ProductData>
        ) {
            const parser = prodPropParsers[key];
            if (parser) {
                target[key] = await parser(val);
            } else { // Fallback to raw string if no parser provided
                target[key] = val as ProductData[K]
            }
            return target
        }

        // When the inputField is specified, the value of `value` will be undefined since the ref cannot point to it.
        // In this case we have to find the input box from the context.
        if (!value) {
            const unvalidatedInputField = document.getElementById(String(category_prod_prop.propName) + "-editor-input")
            if (unvalidatedInputField && ["INPUT", "TEXTAREA"].includes(unvalidatedInputField.tagName)) {
                const inputField = unvalidatedInputField as HTMLInputElement
                value = inputField.value
                inputField.value = ""
            }
        }

        const valid = constraint(value)
        if (!valid) {
            notify(`Value for ${String(key)} is invalid.`)
            return
        }
        if (!setProduct) {return}

        const newProduct: ProductData = cleanseUnsubmittedProduct({...product})
        // Assign the changed value
        await assignTypedValue(key, value, newProduct)
        console.log(newProduct)
        // Update on Supabase
        await updateProductData(newProduct) 
        // Fetch new data to update anything else that changed (last_edited, last_edited_by, etc.)
        fetchNewData()
    }

    const loginContext = useContext(LoginContext)
    const {notify} = useContext(NotificationsContext)

    const inputBox = useRef<HTMLTextAreaElement>(null);
    const {product, productProp, setProduct, originalProd, updateProductOverride} = useContext(EditableProductPropContext)
    const [editable, setEditable] = useState(false);

    if (!productProp) {
        return
    }

    // Set edit permissions
    useEffect(()=>{
        productProp.permission ? 
        setEditable(loginContext.permissions.includes(productProp.permission)) :
        setEditable(loginContext.permissions.includes("edit_products"))
    }, [loginContext])

    // Auto-resize text field when value changes
    useEffect(() => {
        if (inputBox.current && productProp) {
            const newVal = product[productProp?.propName]
            inputBox.current.value = newVal ? newVal.toString() : ""
            autoResizeTextarea(inputBox.current)
        }
    }, [product])

    return <div className="editable-prop" id={productProp.propName.toString()+"-editable-prop"}>
        <div className="editable-prop-title">
            {productProp.displayName}
            {productProp.tooltip ? <span className="superscript tooltipable">[?]<span className="tooltip">{productProp.tooltip}</span></span> : <></>}
        </div>
        <div className="editable-prop-input-box">
            {productProp.prefix ? <p>{productProp.prefix}</p> : <></>}
            {inputField ? inputField : 
            <textarea 
                className="prop-editor-input"
                id={productProp.propName.toString()+"-editor-input"}
                defaultValue={product[productProp.propName] == null ? product[productProp.propName]?.toString() : "Error: Invalid Key Value"}
                onInput={(e) => autoResizeTextarea(e.currentTarget)}
                ref={(el) => {autoResizeTextarea(el); inputBox.current = el}}
                disabled={!editable}
            />}
            {productProp.postfix ? <p>{productProp.postfix}</p> : <></>}
        </div>
        <div className="prop-buttons">
            <button 
                className="update-prop-button" 
                onClick={() => {updateProduct(productProp.propName, inputBox.current?.value, productProp.constraint)}}
                disabled={!editable}
            >Update</button>
            <button 
                className="reset-prop-button" 
                onClick={() => {updateProduct(productProp.propName, originalProd[productProp.propName], () => true)}}
                disabled={!editable}
            >Reset</button>
        </div>
    </div>
}

function autoResizeTextarea(el: HTMLTextAreaElement | null) {
  if (el) {
    el.style.height = 'auto'; // Reset
    el.style.height = `${el.scrollHeight + 10}px`; // Set to scroll height
  }
}