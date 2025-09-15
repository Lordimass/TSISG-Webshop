import { getCategoryID } from "../../../lib/netlifyFunctions";
import { ProductData } from "../../../lib/types";

// Mapping of keys for the product type to parsers to convert from strings to the respective type for that key
//
// These are asynchronous in case extra actions have to take place, e.g. creating a new category in the database

// if a new category name has been input. In the vast majority of cases these resolve instantly.
export const prodPropParsers: Partial<Record<keyof ProductData, (val: string) => Promise<any>>> = {
    name: async (val) => val,
    origin_country_code: async (val) => val,
    description: async (val) => val,
    customs_description: async (val) => val,

    // Convert to integer
    weight: async (val) => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) {throw new Error("Invalid weight string wasn't caught by a constraint.")}
        return num
    },

    // Convert to integer
    sort_order: async (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {throw new Error("Invalid sort_order string wasn't caught by a constraint.")}
        return num
    },

    // Convert to integer
    stock: async (val) => {
        const num = parseInt(val, 10);
        if (isNaN(num)) {throw new Error("Invalid stock string wasn't caught by a constraint.")}
        return num
    },

    // Convert to float
    price: async (val) => {
        const num = parseFloat(val);
        if (isNaN(num)) {throw new Error("Invalid price string wasn't caught by a constraint.")}
        return num;
    },

    // Convert to boolean
    active: async (val) => {
        val = val.toLowerCase()
        if (val === "true") return true;
        if (val === "false") return false;
        throw new Error("Invalid boolean wasn't caught by constraint.");
    },

    // Convert category name to ID
    category_id: async (val) => {
        console.log(val)
        const ID = await getCategoryID(val)
        if (isNaN(ID)) {throw new Error(`Failed to fetch Category ID for given Category Name ${val}`)}
        return ID
    },

    // Convert tags string to array of tag names
    tags: async (val) => {
        if (!val) throw new Error("Tags string is empty");
        // Split string by commas andr remove trailing white space
        const tags = val.split(",").map(tag => {
            return tag
                .trim() // Remove trailing spaces
                .replace(" ", "-") // Spaces to dashes
                .replace(/-+/g, "-") // Collapse repeated dashes into 1
                .toLowerCase() // Lower case the whole string
                .replace(/[^a-z0-9-]+/g, "") // Cleanse characters
        });
        // Filter out blank tags
        return tags.filter(tag => tag != "");
    }
}