import Ajv, {ValidationError} from "ajv";
import addFormats from "ajv-formats";
import {FromSchema, JSONSchema} from "json-schema-to-ts";
import rawSchemas from "@shared/schemas/schemas.json";

export const ajv = new Ajv();

/* NOTE: Run `npm run generate-schemas` to generate the schemas.json file for the first time. It is excluded from version
 control since the file can grow quite large.

 Once you have the file generated, it can be updated automatically by running `npm run watch:generate-schemas`, or by
  using the WebStorm configuration `TSISG-Dev`, which runs this task silently in the background.
*/

/*** Compiled Schemas from types defined in `@shared/types`*/
export const SCHEMAS = rawSchemas;

/** A defined Schema name. */
export type SchemaName = keyof typeof SCHEMAS;
const typedSchemas = SCHEMAS as Record<SchemaName, JSONSchema>

/** Type mapping from schema name to TypeScript type */
export type SchemaTypeMap = {
    [K in SchemaName]: FromSchema<typeof typedSchemas[K]>
};

// Add all the entries to AJV so that they can reference each other.
Object.entries(SCHEMAS).forEach(([key, schema]) => {
    ajv.addSchema(schema, key);
});

// Add formats like date-time to AJV so that types can reference them.
addFormats(ajv)

/** Pre-compiled validator functions for types with associated schemas. */
export const VALIDATORS: { [K in SchemaName]: ((data: unknown) => data is SchemaTypeMap[K]) & {errors: ValidationError[]}; } =
    Object.fromEntries(
        (Object.entries(SCHEMAS) as [SchemaName, JSONSchema][]).map(([key, schema]) => [
            key,
            ajv.compile(schema) as ((data: unknown) => data is SchemaTypeMap[typeof key])
        ])
    ) as { [K in SchemaName]: ((data: unknown) => data is SchemaTypeMap[K]) & {errors: ValidationError[]}; };

export function logValidationErrors(validator: keyof typeof VALIDATORS) {
    if (VALIDATORS[validator].errors) {
        VALIDATORS[validator].errors.forEach(error => {
            console.log(error);
        })
    } else {
        console.log("No validation errors")
    }
}