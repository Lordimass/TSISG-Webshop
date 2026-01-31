import {createContext} from "react"
import {ProductData, UnsubmittedProductData} from "@shared/types/types.ts"
import {blank_product} from "../../lib/consts.ts"
import {isNumeric} from "../../lib/lib.tsx"
import {updateTagsOverride} from "./updateProductOverrides.tsx";
import {fetchPropAutofillData} from "../../pages/products/lib.tsx";
import {getCategoryID} from "@shared/functions/supabase.ts";
import {supabase} from "../../lib/supabaseRPC.tsx";
import {SCHEMAS} from "@shared/schemas/schemas.ts";
import {snakeToTitleCase} from "@shared/functions/functions.ts";

// Editable Product Properties
export type EditableProductProps = { [K in keyof ProductData]?: EditableProductProp<K> }
export type EditableProductProp<T extends keyof ProductData> = {
    propName: T
    displayName: string
    /** String to display after input field (e.g. units) */
    postfix?: string
    /** String to display before input field (e.g. units) */
    prefix?: string
    /** String to display next to display name as a hint for what should go in the box */
    tooltip?: string
    /**
     * The permission required to edit this prop.<br>
     * By default, all props are only editable under the `edit_products` permission, key allows specification of a
     * further required permission.<br>
     * These values also need to be kept up to date in `updateProductData` to be secure.
     */
    permission?: string
    /** Boolean method which returns true if the value passed is a valid value for this prop, false if not. */
    constraint: (value: string) => boolean,
    /** Mode of any autocompletion applied to the input field */
    autocompleteMode: "NONE" | "SINGLE" | "MULTI"
    /** A function to run to update this property on the remote, instead of the default functionality */
    updateProductOverride?: (value: string, editorContext: ProductEditorContextType) => Promise<void> | void
    /** Function to extract a display string for this property from the product. */
    toStringParser: (product: ProductData | UnsubmittedProductData) => string
    /** A function to parse a display string for this property back to a value that can be used to update the product */
    fromStringParser: ((val: string) => Promise<ProductData[T] | null>) | ((val: string) => ProductData[T] | null)
}

// Default settings for every property
const prodDataProperties = SCHEMAS.ProductData.definitions.ProductData.properties
export const defaults: EditableProductProps = Object.keys(
    SCHEMAS.ProductData.definitions.ProductData.properties).map(
    (key) => {
        const propName = key as keyof ProductData;
        const prop = prodDataProperties[propName]
        return {
            propName,
            displayName: snakeToTitleCase(propName),
            constraint: (_value: string) => true, // Always editable
            toStringParser: (product: ProductData | UnsubmittedProductData) => product[propName]?.toString() || "",
            fromStringParser: (val: string) => val ? val as ProductData[typeof propName] : null, // Parse to same string
            autocompleteMode: "NONE",
            tooltip: "description" in prop ? prop.description : undefined,
        }
    }).reduce((a, v) => ({...a, [v.propName]: v}), {} )

delete defaults.images
delete defaults.category

/** Product prop overrides */
export const overrides = {
    sku: {...defaults.sku!,
        displayName: "SKU",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    name: {...defaults.name!,
        constraint: (value: string) => value.length <= 50
    },
    price: {...defaults.price!,
        postfix: "GBP",
        permission: "edit_price",
        constraint: (value: string) => isNumeric(value) && parseFloat(value) >= 0,
        fromStringParser: val => parseFloat(val)
    },
    stock: {...defaults.stock!,
        tooltip: "The number of this product left in stock",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0,
        fromStringParser: val => parseInt(val, 10)
    },
    active: {...defaults.active!,
        tooltip: "Whether or not the product can be added to baskets or not. If it's already in a customers basket this does not remove it. Must be 'true' or 'false'",
        constraint: (value: string) => value.toLowerCase() === "true" || value.toLowerCase() === "false",
        fromStringParser: val => {
            if (val === "true") return true;
            if (val === "false") return false;
            else throw new Error(`Invalid boolean ${val} wasn't caught by prop constraint.`)
        }
    },
    weight: {...defaults.weight!,
        postfix: "grams",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0,
        fromStringParser: val => parseFloat(val)
    },
    customs_description: {...defaults.customs_description!,
        constraint: (value: string) => value.length < 50
    },
    extended_customs_description: {...defaults.extended_customs_description!,
        constraint: (value: string) => value.length < 300
    },
    origin_country_code: {...defaults.origin_country_code!,
        constraint: (value: string) => value.length === 3
    },
    sort_order: {...defaults.sort_order!,
        constraint: (value: string) => isNumeric(value),
        fromStringParser: val => parseInt(val)
    },
    category_id: {...defaults.category_id!,
        displayName: "Category",
        tooltip: "The name of the category to place this product in, can be used to create new categories if one with the given name doesn't already exist",
        constraint: (_value: string) => true,
        toStringParser: (product: ProductData | UnsubmittedProductData) => product.category.name,
        autocompleteMode: "SINGLE",
        fromStringParser: async (val) => {
            const ID: number = await getCategoryID(supabase, val)
            if (isNaN(ID)) {
                throw new Error(`Failed to fetch Category ID for given Category Name ${val}`)
            }
            return ID
        }
    },
    tags: {...defaults.tags!,
        tooltip: "A comma separated list of tags associated with this product",
        constraint: (_value: string) => true,
        updateProductOverride: updateTagsOverride,
        toStringParser: (product: ProductData | UnsubmittedProductData) => {
            const tagNames = product.tags.map(tag => tag.name)
            return tagNames.toString()
                .replace(/[\[\]]/g, "") // Remove square brackets.
                .replace(/,/g, ", ") // Add spaces between commas.
        },
        autocompleteMode: "MULTI",
        fromStringParser: async (val) => {
            if (!val) throw new Error("Tags string is empty");
            // Split string by commas andr remove trailing white space
            let tags = val.split(",").map(tag => {
                return tag
                    .trim() // Remove trailing spaces
                    .replace(" ", "-") // Spaces to dashes
                    .replace(/-+/g, "-") // Collapse repeated dashes into 1
                    .toLowerCase() // Lower case the whole string
                    .replace(/[^a-z0-9-]+/g, "") // Cleanse characters down to just a-z | A-Z
            }).filter(tag => tag != "") // Filter out blank tags
            return tags.map(tag => {
                return {name: tag, created_at: ""}
            })
        }
    },
    group_name: {...defaults.group_name!,
        constraint: (_value: string) => true,
        autocompleteMode: "SINGLE"
    },
    inserted_at: {...defaults.inserted_at!,
        displayName: "Created At",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    last_edited: {...defaults.last_edited!,
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    last_edited_by: {...defaults.last_edited_by!,
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    metadata: {...defaults.metadata!,
        tooltip: "JSON String contianing additional information on this product. Must be a valid JSON string.",
        toStringParser: (p) => JSON.stringify(p.metadata, null, 2),
        constraint: isValidJson,
        fromStringParser: val => JSON.parse(val),
    },
    customer_metadata: {...defaults.customer_metadata!,
        toStringParser: (p) => JSON.stringify(p.customer_metadata, null, 2),
        constraint: isValidJson,
        fromStringParser: val => JSON.parse(val)
    }
} satisfies EditableProductProps

export const editableProductProps = {...defaults, ...overrides}

/**
 * Checks whether the given value is a valid JSON string.
 * @param value The value to check for validity
 * @return `true` if `value` represents a valid JSON string, `false` otherwise.
 */
function isValidJson(value: string){
    // Attempt to convert to JSON, return false if it fails
    let valid = true;
    try {
        JSON.parse(value)
    }
    catch (e: unknown) {
        if (!(e instanceof SyntaxError)) {throw e}
        valid = false
    }
    return valid
}

export interface ProductEditorContextType {
    originalProd: ProductData
    product: ProductData | UnsubmittedProductData,
    setProduct?: (p: ProductData | UnsubmittedProductData) => void,
    fetchNewData?: () => Promise<void>,
    propLists?: Awaited<ReturnType<typeof fetchPropAutofillData>>
}

export const ProductEditorContext = createContext<ProductEditorContextType>(
    {product: blank_product, originalProd: blank_product}
)