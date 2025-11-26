import {JSONSchema} from "json-schema-to-ts";

/**
 * Required shape of environment variable for VITE_SHIPPING_OPTION_GROUPS.
 */
export interface ShippingOptionGroups {
    uk: string[];
    eu: string[];
    world: string[];
}