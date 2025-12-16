import React, {ComponentType, createContext, FunctionComponent} from "react"
import { ProductData } from "@shared/types/types"
import { UnsubmittedProductData } from "./types.ts"
import { blank_product } from "../../../lib/consts"
import { isNumeric } from "../../../lib/lib"
import {Pie} from "recharts";
import displayName = Pie.displayName;
import {AutocompleteInput} from "../../../components/autocompleteInput/autocompleteInput.tsx";
import {updateTagsOverride} from "./updateProductOverrides.tsx";
import {fetchPropAutofillData} from "../lib.tsx";
import {getCategoryID} from "@shared/functions/supabase.ts";
import {supabase} from "../../../lib/supabaseRPC.tsx";

// Editable Product Properties
export type EditableProductProps = {[K in keyof ProductData]?: EditableProductProp<K>}
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
    fromStringParser: ((val: string) => Promise<ProductData[T]>) | ((val: string) => ProductData[T])
}

function getDefaultProductProps<T extends keyof ProductData>(key: T) {
    return {
        propName: key,
        displayName: key
            .replace(/_/g, ' ') // Replace `_` with ` `
            .replace(/\b\w/g, (char) => char.toUpperCase()), // Capitalise each word
        constraint: (_value: string) => true, // Always editable
        toStringParser: (product: ProductData | UnsubmittedProductData) => product[key]?.toString() || "",
        fromStringParser: (val: string) => val as ProductData[T], // Parse to same string
        autocompleteMode: "NONE"
    } satisfies Partial<EditableProductProp<T>>
}

export const editableProductProps = {
    sku: { ...getDefaultProductProps("sku"),
        displayName: "SKU",
        tooltip: "The ID of this product.",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    name: { ...getDefaultProductProps("name"),
        tooltip: "User facing name of the product. Max 50 characters.",
        constraint: (value: string) => value.length <= 50
    },
    price: { ...getDefaultProductProps("price"),
        tooltip: "The price of the product in GBP",
        postfix: "GBP",
        permission: "edit_price",
        constraint: (value: string) => isNumeric(value) && parseFloat(value) >= 0,
        fromStringParser: val => parseFloat(val)
    },
    stock: { ...getDefaultProductProps("stock"),
        tooltip: "The number of this product left in stock",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0,
        fromStringParser: val => parseInt(val, 10)
    },
    active: {...getDefaultProductProps("active"),
        tooltip: "Whether or not the product can be added to baskets or not. If it's already in a customers basket this does not remove it. Must be 'true' or 'false'",
        constraint: (value: string) => value.toLowerCase() === "true" || value.toLowerCase() === "false",
        fromStringParser: val => {
            if (val === "true") return true;
            if (val === "false") return false;
            else throw new Error(`Invalid boolean ${val} wasn't caught by prop constraint.`)
        }
    },
    weight: { ...getDefaultProductProps("weight"),
        postfix: "grams",
        tooltip: "The weight of a single product in grams.",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0,
        fromStringParser: val => parseFloat(val)
    },
    customs_description: { ...getDefaultProductProps("customs_description"),
        tooltip: "A short description of the product for customs forms. Max length: 50 characters.",
        constraint: (value: string) => value.length < 50
    },
    extended_customs_description: { ...getDefaultProductProps("extended_customs_description"),
        tooltip: "An extended description for customs forms applicable to higher value orders. Max length: 300 characters.",
        constraint: (value: string) => value.length < 300
    },
    origin_country_code: { ...getDefaultProductProps("origin_country_code"),
        tooltip: "The ISO 3166-1 alpha-3 country code of the country which this product had its final manufacturing stage in. e.g. \"CHN\" for \"China\"",
        constraint: (value: string) => value.length === 3
    },
    sort_order: { ...getDefaultProductProps("sort_order"),
        tooltip: "The order in which products are primarily sorted in, lower values appear sooner in the list.",
        constraint: (value: string) => isNumeric(value),
        fromStringParser: val => parseInt(val)
    },
    description: { ...getDefaultProductProps("description"),
        tooltip: "The user facing description of the product, supports markdown (*italics*, **bold**, (links)[URL], etc.)",
        constraint: (_value: string) => true
    },
    category_id: { ...getDefaultProductProps("category_id"),
        displayName: "Category",
        tooltip: "The name of the category to place this product in, can be used to create new categories if one with the given name doesn't already exist",
        constraint: (_value: string) => true,
        toStringParser: (product: ProductData | UnsubmittedProductData) => product.category.name,
        autocompleteMode: "SINGLE",
        fromStringParser: async (val) => {
            const ID: number = await getCategoryID(supabase, val)
            if (isNaN(ID)) {throw new Error(`Failed to fetch Category ID for given Category Name ${val}`)}
            return ID
        }
    },
    tags: { ...getDefaultProductProps("tags"),
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
            return tags.map(tag => {return {name: tag, created_at: ""}})
        }
    },
    group_name: { ...getDefaultProductProps("group_name"),
        tooltip: "Products which have the same group name will be displayed together, with each of these products becoming variants of each other.",
        constraint: (_value: string) => true,
        autocompleteMode: "SINGLE"
    },
    inserted_at: { ...getDefaultProductProps("inserted_at"),
        displayName: "Created At",
        tooltip: "Timestamp at which this product was created",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    last_edited: { ...getDefaultProductProps("last_edited"),
        tooltip: "Timestamp at which this product was last edited",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    },
    last_edited_by: { ...getDefaultProductProps("last_edited_by"),
        tooltip: "The ID of the last person to edit this product",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false, // Never editable
    }
} satisfies EditableProductProps

export interface ProductEditorContextType {
    originalProd: ProductData
    product: ProductData | UnsubmittedProductData,
    setProduct?: React.Dispatch<React.SetStateAction<ProductData | UnsubmittedProductData>>
    resetOverride?: () => void,
    fetchNewData?: () => Promise<void>,
    propLists?: Awaited<ReturnType<typeof fetchPropAutofillData>>
}
export const ProductEditorContext = createContext<ProductEditorContextType>(
    {product: blank_product, originalProd: blank_product}
)