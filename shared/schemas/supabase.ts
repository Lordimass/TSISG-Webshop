import {FromSchema, JSONSchema} from "json-schema-to-ts"
import {ajv} from "@shared/schemas/schemas.ts";

export const ProductDataSchema = /** @satisfies {import('json-schema-to-ts').JSONSchema} */ ({
    type: "object",
    properties: {
        sku: {type: "number"},
        /** Time at which the product was added to the database as an ISO date string */
        inserted_at: {
            type: "string",
            description: "Time at which the product was added to the database as an ISO date string"
        },
        /** Time at which the product was fetched from the database as an ISO date string, representative of when this data was last confirmed valid */
        fetched_at: {type: "string"},
    },
    required: ["sku", "inserted_at", "fetched_at"],
    additionalProperties: false
}) as const satisfies JSONSchema;
export type ProductData = FromSchema<typeof ProductDataSchema>
export const validateProductData = ajv.compile(ProductDataSchema);