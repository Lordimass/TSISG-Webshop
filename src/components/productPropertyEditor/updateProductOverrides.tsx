// Override methods for editing product properties. 
// These methods are called when the user makes changes 
// to a property type which requires special handling

import {editableProductProps, ProductEditorContextType} from "./editableProductProps.ts";
import {setProductTags} from "@shared/functions/supabase.ts";
import {supabase} from "../../lib/supabaseRPC.tsx";
import {ContextType} from "react";
import {ProductContext} from "../../pages/products/lib.tsx";

/**
 * Updates the tags property of a product.
 * @param value The new value for the product.
 * @param editorContext Context from the product editor.
 * @param productContext Context from the product.
 */
export async function updateTagsOverride(
    value: string,
    editorContext: ProductEditorContextType,
    productContext: ContextType<typeof ProductContext>
): Promise<void> {
    // Validate the value using the constraint function
    if (!editableProductProps.tags.constraint(value)) throw new Error(`Invalid value for tags: ${value}`);
    const tags = await editableProductProps.tags?.fromStringParser(value);
    await setProductTags(supabase, productContext.product.sku, tags)
    editorContext.fetchNewData ? await editorContext.fetchNewData() : null;
}