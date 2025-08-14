import { product } from "../../assets/components/products";
import { getCategoryID } from "../../assets/utils";

// Mapping of keys for the product type to parsers to convert from strings to the respective type for that key
//
// These are asynchronous in case extra actions have to take place, e.g. creating a new category in the database
// if a new category name has been input. In the vast majority of cases these resolve instantly.
export const prodPropParsers: Partial<Record<keyof product, (val: string) => Promise<any>>> = {
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
}