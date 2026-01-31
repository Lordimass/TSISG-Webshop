import React, {useContext, useEffect, useState} from "react"
import {fetchPropAutofillData, ProductContext} from "../lib"
import {openObjectInNewTab} from "../../../lib/lib"
import {ProductImageEditor} from "../imageEditor/imageEditor.tsx"

import "./productEditor.css"
import {getProducts} from "@shared/functions/supabaseRPC.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";
import {
    editableProductProps,
    ProductEditorContext
} from "../../../components/productPropertyEditor/editableProductProps.ts";
import {ProdPropEditor} from "../../../components/productPropertyEditor/editableProdPropBox.tsx";

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
        fetch().then()
    }, [])

    return (<><div className="product-editor">
        <h2> Basic Product Data </h2>
        {/******************** Main property editors ********************/}
        <ProductEditorContext.Provider value={{fetchNewData, propLists}}>
        <div className="product-editor-grid">
            {/* All standard text field properties */}
            {Object.keys(editableProductProps).map((key) => {
                return <ProdPropEditor propName={key as keyof typeof editableProductProps} key={key} />
            })}
        </div>
        </ProductEditorContext.Provider>

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

