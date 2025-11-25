import {FromSchema, JSONSchema} from "json-schema-to-ts"
import {ajv} from "@shared/schemas/schemas.ts";

export const ShippingOptionGroupsSchema = /** @satisfies {import('json-schema-to-ts').JSONSchema} */ ({
    type: "object",
    properties: {
        uk: {type: "array", items: {type: "string"}},
        eu: { type: "array", items: {type: "string"} },
        world: { type: "array", items: {type: "string"} }
    },
    required: ["uk", "eu", "world"],
    additionalProperties: false
}) as const satisfies JSONSchema;
export type ShippingOptionGroups = FromSchema<typeof ShippingOptionGroupsSchema>
export const validateShippingOptionGroups = ajv.compile(ShippingOptionGroupsSchema);