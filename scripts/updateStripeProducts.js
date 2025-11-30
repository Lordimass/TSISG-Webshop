var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { getProducts } from "@shared/functions/supabaseRPC.ts";
import { supabaseAnon } from "../netlify/lib/getSupabaseClient.mts";
import Stripe from "stripe";
import { parseArgs } from "node:util";
/** Fetch active product data from Stripe.
 * @returns An array of objects containing all active products on Stripe.
 */
function fetchActiveStripeProducts() {
    return __awaiter(this, void 0, void 0, function () {
        var prods;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    prods = [];
                    return [4 /*yield*/, stripe
                            .products
                            .list({ active: true })
                            .autoPagingEach(function (prod) { prods.push(prod); })];
                case 1:
                    _a.sent();
                    return [2 /*return*/, prods];
            }
        });
    });
}
/**
 * Call the Netlify function to update the stripe product in relation to a Supabase SKU.
 * @param sku The SKU of the product on Supabase.
 * @param name The human-readable name of the product.
 */
function updateStripeProduct(sku, name) {
    return __awaiter(this, void 0, void 0, function () {
        var updateEndpoint, resp, body;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("Updating SKU".concat(sku, " - ").concat(name));
                    updateEndpoint = new URL(endpoint);
                    updateEndpoint.searchParams.set("sku", "" + sku);
                    return [4 /*yield*/, fetch(updateEndpoint, {})];
                case 1:
                    resp = _a.sent();
                    return [4 /*yield*/, resp.text()];
                case 2:
                    body = _a.sent();
                    console.log("[".concat(resp.status, ": ").concat(resp.statusText, "] ").concat(body !== null && body !== void 0 ? body : "", "\n"));
                    return [2 /*return*/];
            }
        });
    });
}
console.log("Syncing Supabase Products -> Stripe");
// Process command arguments
var args = parseArgs({ options: {
        port: { type: "string", short: 'p', default: "8888" },
        netlifyFunction: { type: "string", short: 'f', default: "updateStripeProducts" },
        archiveAllOldPrices: { type: "boolean", default: false },
    } }).values;
var endpoint = new URL("http://localhost:".concat(args.port, "/.netlify/functions/").concat(args.netlifyFunction));
endpoint.searchParams.set("archiveAllOldPrices", "" + args.archiveAllOldPrices);
// Setup Stripe
if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY does not exist!");
}
export var stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil',
});
// Fetch current products from Supabase & Stripe.
var supabaseProds = await getProducts(supabaseAnon);
var stripeProds = await fetchActiveStripeProducts();
var _loop_1 = function (stripeProd) {
    // If there's no associated metadata, the Stripe product is malformed and should be de-activated.
    if (!stripeProd.metadata.sku) {
        await stripe.products.update(stripeProd.id, { active: false });
    }
    // Search for matches
    var matchedSupabaseProds = supabaseProds.filter(function (supabaseProd) { return "" + supabaseProd.sku === stripeProd.metadata.sku; });
    // If a match is found, update Stripe and remove the product from the list of Supabase products
    if (matchedSupabaseProds.length > 0) {
        await updateStripeProduct(matchedSupabaseProds[0].sku, matchedSupabaseProds[0].name);
        supabaseProds.filter(function (p) { return p.sku !== matchedSupabaseProds[0].sku; });
    }
    // If no match is found, disable this Stripe Product
    else if (matchedSupabaseProds.length === 0) {
        await stripe.products.update(stripeProd.id, { active: false });
    }
};
// For each Stripe product, try to find a matching Supabase product to update information from.
for (var _i = 0, stripeProds_1 = stripeProds; _i < stripeProds_1.length; _i++) {
    var stripeProd = stripeProds_1[_i];
    _loop_1(stripeProd);
}
// For each remaining Supabase product, create a new Stripe product since we know it doesn't exist yet.
for (var _a = 0, supabaseProds_1 = supabaseProds; _a < supabaseProds_1.length; _a++) {
    var supabaseProd = supabaseProds_1[_a];
    await updateStripeProduct(supabaseProd.sku, supabaseProd.name);
}
