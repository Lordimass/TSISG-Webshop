// Override methods for editing product properties. 
// These methods are called when the user makes changes 
// to a property type which requires special handling

import { getJWTToken } from "../../../lib/auth";
import { ProductData } from "@shared/types/types";
import {editableProductProps} from "./editableProductProps.ts";

/**
 * Updates the tags property of a product.
 * @param value The new value for the product.
 * @param originalProd The original product data.
 * @param fetchNewData A function to update page data after the update.
 * @param constraint A function to validate the new value.
 */
export async function updateTagsOverride(
    value: string,
    originalProd: ProductData,
    fetchNewData: () => Promise<void>,
    constraint: (value: string) => boolean): Promise<void> {

    // Validate the value using the constraint function
    if (!constraint(value)) {
        throw new Error(`Invalid value for tags: ${value}`);
    }

    const tags = await editableProductProps.tags?.fromStringParser(value);

    await fetch("/.netlify/functions/setProductTags", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${await getJWTToken()}`
        },
        body: JSON.stringify({
            sku: originalProd.sku,
            tags: tags.map(tag => tag.name),
        })
    });

    await fetchNewData();
}