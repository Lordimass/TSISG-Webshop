import { createContext } from "react"
import { ProductData } from "@shared/types/types"
import { UnsubmittedProductData } from "./types"
import { blank_product } from "../../../lib/consts"
import { isNumeric } from "../../../lib/lib"
import {Pie} from "recharts";
import displayName = Pie.displayName;

// Editable Product Properties
export type EditableProductProp = {
    propName: keyof ProductData
    displayName: string
    /** String to display after input field (e.g. units) */
    postfix?: string
    /** String to display before input field (e.g. units) */
    prefix?: string
    /** String to display next to display name as a hint for what should go in the box */
    tooltip?: string
    /** 
     * The permission required to edit this prop.
     *
     * By default, all props are only editable under the `edit_products` permission, key allows specification of a
     * further required permission.
     *
     * These values also need to be kept up to date in `updateProductData` to be secure.
    */
    permission?: string
    /** Boolean method which returns true if the value passed is a valid value for this prop, false if not. */
    constraint: (value: string) => boolean
}

// When updating this, don't forget to also provide a parser in prodPage.tsx to allow conversion to the right type for the prop.
export const editableProductProps: EditableProductProp[] = [
    {
        propName: "sku",
        displayName: "SKU",
        tooltip: "The ID of this product.",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "inserted_at",
        displayName: "Created At",
        tooltip: "Timestamp at which this product was created",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "name",
        displayName: "Name",
        tooltip: "User facing name of the product. Max 50 characters.",
        constraint: (value: string) => value.length <= 50
    },
    {
        propName: "price",
        displayName: "Price",
        tooltip: "The price of the product in GBP",
        postfix: "GBP",
        permission: "edit_price",
        constraint: (value: string) => isNumeric(value)
    },
    {
        propName: "stock",
        displayName: "Stock",
        tooltip: "The number of this product left in stock",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0
    },
    {
        propName: "active",
        displayName: "Active",
        tooltip: "Whether or not the product can be added to baskets or not. If it's already in a customers basket this does not remove it. Must be 'true' or 'false'",
        constraint: (value: string) => value.toLowerCase() === "true" || value.toLowerCase() === "false"
    },
    {
        propName: "weight",
        displayName: "Weight",
        postfix: "grams",
        tooltip: "The weight of a single product in grams.",
        constraint: (value: string) => isNumeric(value) && parseInt(value, 10) >= 0
    },
    {
        propName: "customs_description",
        displayName: "Customs Description",
        tooltip: "A short description of the product for customs forms. Max length: 50 characters.",
        constraint: (value: string) => value.length < 50
    },
    {
        propName: "extended_customs_description",
        displayName: "Extended Customs Description",
        tooltip: "An extended description for customs forms applicable to higher value orders. Max length: 300 characters.",
        constraint: (value: string) => value.length < 300
    },
    {
        propName: "origin_country_code",
        displayName: "Origin Country Code",
        tooltip: "The ISO 3166-1 alpha-3 country code of the country which this product had its final manufacturing stage in. e.g. \"CHN\" for \"China\"",
        constraint: (value: string) => value.length === 3
    },
    {
        propName: "sort_order",
        displayName: "Sort Order",
        tooltip: "The order in which products are primarily sorted in, lower values appear sooner in the list.",
        constraint: (value: string) => isNumeric(value)
    },
    {
        propName: "description",
        displayName: "Description",
        tooltip: "The user facing description of the product, supports markdown (*italics*, **bold**, (links)[URL], etc.)",
        constraint: (_value: string) => true
    },
    {
        propName: "last_edited",
        displayName: "Last Edited",
        tooltip: "Timestamp at which this product was last edited",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    },
    {
        propName: "last_edited_by",
        displayName: "Last Edited By",
        tooltip: "The ID of the last person to edit this product",
        permission: "NON-EDITABLE PROP",
        constraint: (_value: string) => false // Never editable
    }
]

export const category_prod_prop: EditableProductProp = {
    propName: "category_id",
    displayName: "Category",
    tooltip: "The name of the category to place this product in, can be used to create new categories if one with the given name doesn't already exist",
    constraint: (_value: string) => true
}

export const tags_prod_prop: EditableProductProp = {
    propName: "tags",
    displayName: "Tags",
    tooltip: "A comma separated list of tags associated with this product",
    constraint: (_value: string) => true
}

export const group_name_prod_prop: EditableProductProp = {
    propName: "group_name",
    displayName: "Group Name",
    tooltip: "Products which have the same group name will be displayed together, with each of these products becoming variants of each other.",
    constraint: (_value: string) => true
}

export const EditableProductPropContext = createContext<{
    originalProd: ProductData
    product: ProductData | UnsubmittedProductData,
    setProduct?: React.Dispatch<React.SetStateAction<ProductData | UnsubmittedProductData>>
    productProp?: EditableProductProp
    updateProductOverride?: (
        key: keyof ProductData, 
        value: any, 
        originalProd: ProductData,
        fetchNewData: () => Promise<void>,
        constraint: (value: string) => boolean) => Promise<void>
    resetOverride?: () => void
}>({product: blank_product, originalProd: blank_product})