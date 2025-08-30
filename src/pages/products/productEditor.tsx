import { createContext, ReactElement, useContext, useEffect, useRef, useState } from "react"
import { fetchFromNetlifyFunction, updateProductData, useFetchFromNetlifyFunction } from "../../assets/utils"
import { ProductData } from "../../lib/types"
import { category_prod_prop, EditableProductProp, editableProductProps, tags_prod_prop } from "./editableProductProps"
import { blank_product } from "../../assets/consts"
import { ProductContext } from "./prodPage"
import MultiAutocomplete from "../../assets/components/commaSeparatedAutocomplete/commaSeparatedAutocomplete"
import { openObjectInNewTab } from "../../lib/lib"
import { prodPropParsers } from "./prodPropParsers"
import { LoginContext } from "../../app"
import { updateTagsOverride } from "./updateProductOverrides"
import { NotificationsContext } from "../../assets/components/notification"

const EditableProductPropContext = createContext<{
    originalProd: ProductData
    product: ProductData,
    setProduct?: React.Dispatch<React.SetStateAction<ProductData>>
    productProp?: EditableProductProp
    updateProductOverride?: (
        key: keyof ProductData, 
        value: any, 
        originalProd: ProductData,
        fetchNewData: () => Promise<void>,
        constraint: (value: string) => boolean) => Promise<void>
    resetOverride?: () => void
}>({product: blank_product, originalProd: blank_product})

export default function ProductEditor() {
    async function fetchNewData() {
        const response = await fetchFromNetlifyFunction("getProduct", JSON.stringify({sku: product.sku}))
        if (!response.error && response.data && setProduct) {
            setProduct(response.data)
        }
        const tagsResp = await fetchFromNetlifyFunction("getPropertyLists")
        if (!response.error && response.data && setProduct) {
            propLists = tagsResp.data
        }
    }

    const {product, setProduct, originalProd} = useContext(ProductContext)
    if (!product) {
        return
    }

    // Fetch prop lists
    let propLists: {
        tags: {id: number, name: string}[], 
        categories: {id: number, name: string}[]
    } | undefined = useFetchFromNetlifyFunction("getPropertyLists").data

    // Compile HTMLOptionElement's to use in datalists for autocomplete fields.
    const [catOpts, setCatOpts] = useState<ReactElement[]>([])
    const [tagOpts, setTagOpts] = useState<string[]>([])
    useEffect(() => {
        if (propLists && propLists.categories) {
            setCatOpts(propLists.categories.map((cat) => <option value={cat.name} key={cat.id}>{cat.name}</option>))
            setTagOpts(propLists.tags.map((tag) => tag.name))
        } else {
            setCatOpts([])
            setTagOpts([])
        }
    }, [propLists])

    // Prep input fields to be updated on new data
    const [categoryInput, setCategoryInput] = useState<React.JSX.Element | undefined>()
    const [tagsInput, setTagsInput] = useState<React.JSX.Element | undefined>()
    useEffect(() => {
        setCategoryInput(<>
            <input list="category-options" id={category_prod_prop.propName+"-editor-input"} placeholder={product.category.name} ref={inputBox}/>
            <datalist id="category-options" defaultValue={product.category.name}>{catOpts}</datalist>
        </>)
        setTagsInput(<MultiAutocomplete
            values={tagOpts}
            defaultValue={product.tags.map(tag => tag.name).join(", ")}
        />)
    }, [product, catOpts, tagOpts])

    const inputBox = useRef<HTMLInputElement>(null);

    return (<div className="product-editor">
        <div className="product-editor-grid">
            {/* All standard text field properties */}
            {editableProductProps.map((productProp) => 
            <EditableProductPropContext.Provider 
                value={{product, setProduct, productProp, originalProd}} 
                key={productProp.propName}
            >
                <EditableProdPropBox fetchNewData={fetchNewData}/>
            </EditableProductPropContext.Provider>)}
            
            {/* Category field editor */}
            <EditableProductPropContext.Provider value={{product, setProduct, productProp: category_prod_prop, originalProd}}>
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
    </div>)
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
        }

        // When the inputField is specified, the value of `value` will be undefined since the ref cannot point to it.
        // In this case we have to find the input box from the context.
        if (!value) {
            const unvalidatedInputField = document.getElementById(category_prod_prop.propName + "-editor-input")
            if (unvalidatedInputField && unvalidatedInputField.tagName == "INPUT") {
                const inputField = unvalidatedInputField as HTMLInputElement
                value = inputField.value
                inputField.value = ""
                inputField.placeholder = value
            }
        }

        const valid = constraint(value)
        if (!valid) {
            notify(`Value for ${key} is invalid.`)
            return
        }
        if (!setProduct) {return}

        const newProduct: ProductData = {...product}
        // Assign the changed value
        await assignTypedValue(key, value, newProduct)
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