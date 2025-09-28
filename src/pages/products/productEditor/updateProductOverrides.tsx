// Override methods for editing product properties. 
// These methods are called when the user makes changes 
// to a property type which requires special handling

import { getJWTToken } from "../../../lib/auth";
import { ProductData } from "../../../lib/types";
import { prodPropParsers } from "./prodPropParsers";

/**
 * Updates the tags property of a product.
 * @param key The key of the product to update. Must always be "tags".
 * @param value The new value for the product.
 * @param originalProd The original product data.
 * @param fetchNewData A function to update page data after the update.
 * @param constraint A function to validate the new value.
 */
export async function updateTagsOverride(
    key: keyof ProductData, 
    value: string, 
    originalProd: ProductData,
    fetchNewData: () => Promise<void>,
    constraint: (value: string) => boolean): Promise<void> {
    if (key !== "tags") {
        throw new Error(`Tags override called on non-tags property: ${key}`);
    }

    // Validate the value using the constraint function
    if (!constraint(value)) {
        throw new Error(`Invalid value for tags: ${value}`);
    }

    // Value will be null, we must fetch the contents of the comma-separated autocomplete
    const tagsEditableProp = document.getElementById("tags-editable-prop")
    if (!tagsEditableProp) throw new Error(`Tags editable prop not found`)

    const csaContainer = tagsEditableProp.querySelector(".csa-container");
    if (!csaContainer) throw new Error(`CSA container not found`)

    const input = csaContainer.querySelector("#real-input");
    if (!input || input.tagName !== "TEXTAREA") throw new Error(`Tags text area not found`);

    value = (input as HTMLTextAreaElement).value;

    const parser = prodPropParsers["tags"];
    if (!parser) throw new Error(`No parser found for tags property`);
    const tags = await parser(value);

    await fetch("/.netlify/functions/setProductTags", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${await getJWTToken()}`
        },
        body: JSON.stringify({
            sku: originalProd.sku,
            tags
        })
    });

    await fetchNewData();
}