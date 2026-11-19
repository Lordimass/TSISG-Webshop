import {type Currency} from "dinero.js";
import {type ImageHolder, MinimalImage, type MinimalProductImage} from "@/lib";
import {DEFAULT_LOCALE} from "@/config.ts";
import {GAItem} from "@/lib/types/ga.ts";
import {trackModifyCart} from "@/lib/ga/helpers.ts";

/** A product object with the absolute minimum data to be identifiable as a product */
export interface MinimalProduct {
    /** The ID of this product */
    sku: number | string;
    /** Customer facing name of the product.*/
    name?: string;
    /** Quantity of this product in stock */
    stock?: number;
    [key: string]: unknown;
}

export type ProductDataConstructorOpts = {
    /** Customer facing name of the product.*/
    name?: string;
    /** Quantity of this product in stock */
    stock?: number;
    /** Price of product in the default currency, inc. tax. */
    price?: number;
    /**
     * Products with the same group name can be grouped together (in an array) to be displayed as one product with
     * variants, instead of each as unique products.
     */
    groupName?: string;
    /** All images associated with this product */
    images?: MinimalProductImage[];
    /**
     * Whether this product should be visible in lists of products, or only accessible directly.
     */
    hidden?: boolean;
    /** Whether this is a product which is currently active and available to buy */
    active?: boolean;
    [key: string]: unknown;
} & ProductMetadata;

/** A fully fledged product object. */
export class ProductData implements MinimalProduct, ImageHolder {
    /** The ID of this product */
    public sku: number | string;
    /** Customer facing name of the product.*/
    public name: string;
    /** Quantity of this product in stock */
    public stock: number;
    /** Price of product in the default currency, inc. tax. */
    public price: number;
    /**
     * Products with the same group name can be grouped together (in an array) to be displayed as one product with
     * variants, instead of each as unique products.
     */
    public groupName?: string;
    /** All images associated with this product */
    public images: MinimalProductImage[];
    /** Whether this is a product which is currently active and available to buy */
    public active: boolean;
    /**
     * Whether this product should be visible in lists of products, or only accessible directly.
     */
    public hidden: boolean;
    /** Additional data on this product which isn't encoded in the standard class attributes.*/
    public metadata: ProductMetadata;
    [key: string]: unknown;

    public static NULL: ProductData = new ProductData(0);

    constructor(sku: number | string, opts: ProductDataConstructorOpts = {}) {
        this.sku = sku;
        let { name, stock, price, groupName, images, active, hidden, ...metadata } = opts;
        if (metadata.metadata != undefined) {
            metadata = { ...metadata, ...metadata.metadata };
            delete metadata.metadata;
        }
        this.sku = sku;
        this.name = name ?? "...";
        this.stock = stock ?? 0;
        this.price = price ?? 0;
        this.groupName = groupName;
        this.images = images ? images.sort(MinimalImage.compare) : [];
        this.active = active ?? true;
        this.hidden = hidden ?? false;
        this.metadata = metadata;
    }

    getRepresentativeImage() {
        const repr = this.images.filter(
            (image: MinimalProductImage) =>
                image.association_metadata?.group_representative,
        );
        return repr.length > 0 ? repr[0] : this.images[0];
    };

    getComparisonImages(): MinimalProductImage[] {
        return this.images.filter(img =>
            img.association_metadata?.comparison &&
            !img.association_metadata?.exclude
        )
    }

    /**
     * Given a new quantity and relevant information on a product to associate it with,
     * update the local storage basket to contain that new quantity.
     *
     * Must be called from the client!
     *
     * @param quant The new basket string quantity for the product.
     * @param currency The currency to be used when recording a GA4 event.
     */
    setBasketStringQuantity(
        quant: number,
        currency: Currency = DEFAULT_LOCALE.currency,
    ) {
        /** The change in quantity from this update, used for GA4 triggers */
        let diff = 0;
        const basket = Basket.getBasket();

        // If this is a new basket, set last updated to current time
        if (basket.lastUpdated === 0) basket.lastUpdated = Date.now();

        // Find product and set quantity
        let found: boolean = false;
        // Using for loop instead of forEach for splicing
        for (let i = 0; i < basket.products.length; i++) {
            const item: BasketProduct = basket.products[i];
            if (item.sku == this.sku) {
                diff = quant - (item.basketQuantity ?? 0);
                found = true;
                // Just remove it from the basket if 0
                if (quant == 0) {
                    basket.products.splice(i, 1);
                    break;
                }
                item.basketQuantity = quant;
                break;
            }
        }
        // If it wasn't found, create it
        if (!found && quant > 0) {
            diff = quant;
            basket.products.push(new BasketProduct(this.sku, quant, this));
        }

        // Save to localStorage
        localStorage.setItem("basket", JSON.stringify(basket));
        window.dispatchEvent(new CustomEvent("basketUpdate"));
        trackModifyCart(currency, this, diff);
    }

    hasSku(sku: number | string): boolean {
        return this.sku == sku;
    }

    getDescription() {
        const displayName = this.groupName ?? this.name
        let description = this.metadata.description ?? "";
        description = description.replaceAll(/{{displayName}}/g, displayName);
        description = description.replaceAll(/{{customer_metadata\.(.*)}}/g, (_, args) => this.metadata.customer_metadata?.[args] ?? "");
        return description;
    }

    serialise() {
        return JSON.stringify(this)
    }

    static deserialize(str: string) {
        return Object.assign(Object.create(ProductData.prototype), JSON.parse(str));
    }
}

/** A product which is in the customer's basket */
export class BasketProduct extends ProductData {
    /** The quantity of this product in the user's basket */
    public basketQuantity: number;

    constructor(
        sku: number | string,
        /** The quantity of this product in the user's basket */
        basketQuantity?: number,
        opts?: ProductDataConstructorOpts,
    ) {
        super(sku, opts);
        delete this.metadata.sku;
        this.basketQuantity = basketQuantity ?? 1;
    }
}

/** A basket of products for a customer */
export class Basket {
    /** The products in the basket and their quantities */
    products: BasketProduct[];
    /**
     * The date-time in milliseconds since epoch at which this version of the basket was last updated with
     * information from the database
     */
    lastUpdated: number;
    constructor(
        /** The products in the basket and their quantities */
        products: BasketProduct[],
        /**
         * The date-time in milliseconds since epoch at which this version of the basket was last updated with
         * information from the database
         */
        lastUpdated: number,
    ) {
        this.products = products;
        this.lastUpdated = lastUpdated;
    }

    /**
     * Get the total value of this basket as the sum of product prices multiplied by the quantity in the basket.
     * @returns A number representing the total value of this basket.
     * @example 12.98
     */
    getValue(): number {
        let value = 0;
        this.products.forEach((p) => {
            value += p.price * p.basketQuantity;
        });
        return value;
    }

    /**
     * Get the basket as an array of Google Analytics items.
     */
    getGAItems(): GAItem[] {
        return this.products.map((p) => new GAItem(p));
    }

    /**
     * Fetch and return the basket from `localStorage`.
     *
     * Must be called from the client!
     *
     * @returns A {@link Basket} object. Returns an empty basket with {@link Basket.lastUpdated} set to 0 if no basket was
     * found in localStorage.
     */
    static getBasket(): Basket {
        // Fetch from localStorage
        const basketString = localStorage.getItem("basket");
        if (!basketString) return new Basket([], 0);
        else return this.deserialize(basketString);
    }

    /** Convert a serialized basket string from {@link JSON.stringify} into a basket object */
    private static deserialize(serialized: string): Basket {
        const json = JSON.parse(serialized);
        if (!json.products || !(json.products instanceof Array)) {
            return new Basket([], json.lastUpdated ?? 0);
        }

        // Deserialize products
        const productsJson = json.products as Array<any>;
        const products: BasketProduct[] = productsJson
            .map((p) => {
                if (!p.sku) return null;
                return new BasketProduct(p.sku, p.basketQuantity ?? 0, p);
            })
            .filter((p) => p !== null);

        return new Basket(products, json.lastUpdated ?? 0);
    }
}


interface ProductMetadata {
    active?: boolean;
    /** Weight of the product in grams. */
    weight?: number | null;
    /** The name of this specific variant, if `group_name != undefined` */
    variant_name?: string;
    /** The priority of this product to search engines, used in sitemaps */
    seo_priority?: number;
    sort_order?: number;
    /** The user facing description of the product, supports Markdown (*italics*, **bold**, (links)[URL], etc.) */
    description?: string | null;
    /** Short description for customs forms. Max length: 50 characters.*/
    customs_description?: string | null;
    /** The ISO 3166-1 alpha-3 country code of the country which this product had its final manufacturing stage in. e.g. "CHN" for "China" */
    origin_country_code?: string | null;
    /** For products which are too large to fit in smaller boxes, so require a specific minimum box size to send. */
    package_type_override?: string | null;
    /** An extended description for customs forms applicable to higher value orders. Max length: 300 characters. */
    extended_customs_description?: string | null;
    /** Additional information about the product which is displayed to the customer. Every key-value pair is shown as is. */
    customer_metadata?: { [key: string]: any };
    /**
     * Short informational strings used to identify this product.
     */
    tags?: string[];
    options?: {
        name: string;
        product_id: string;
        other_product_id: string;
        option_group: string;
    }[]
    [key: string]: any;
}

/**
 * A collection of closely related products/variants of the same product
 */
export class ProductGroup implements ImageHolder {
    /** The name of this group of products */
    public groupName: string;
    /** The products in the group */
    public products: ProductData[];

    /**
     * @param products The products in the group
     */
    constructor(products: ProductData[]) {
        this.groupName = products[0]?.groupName
            ? products[0].groupName
            : products[0].name;
        this.products = products;
    }

    /**
     * Fetch a list of all the images associated to this group.
     */
    getAllImages() {
        return this.products.map((p: ProductData) => p.images).flat();
    }

    /**
     * Get the image that represents this group as a whole.
     */
    getRepresentativeImage() {
        const all = this.getAllImages().sort(MinimalImage.compare);
        const repr = this.getRepresentativeImages()
        return repr.length > 0 ? repr[0] : all[0];
    }

    /**
     * Get all images marked as a group representative.
     */
    getRepresentativeImages() {
        const all = this.getAllImages().sort(MinimalImage.compare);
        return all.filter(
            (image: MinimalProductImage) =>
                image.association_metadata?.group_representative,
        );
    }

    getComparisonImages(): MinimalProductImage[] {
        const representatives = this.getRepresentativeImages()
        const representativeComparisons = representatives.filter(img =>
            img.association_metadata?.comparison
        )
        if (representativeComparisons.length >= 2) return representativeComparisons;

        return this.products.length > 0
            ? this.products[0].getComparisonImages()
            : [];
    }

    /**
     * Get all the images which should be displayed on image carousels for a product in this group. This includes `global`
     * images, and excludes `group_representatives` and `group_product_icons`.
     * @param sku The SKU of the product in the group to use as a reference for which images to fetch.
     */
    getCarouselImages(sku: string | number) {
        const imgs = this.products
            .map((p: ProductData) => {
                if (p.sku === sku) {
                    return p.images.filter((i) =>
                        !i.association_metadata?.exclude
                    );
                }
            })
            .flat()
            .filter((i) => !!i)
            .sort(MinimalImage.compare);
        const globals = this.products
            .map((p: ProductData) => {
                return p.images.filter((i) => i.association_metadata?.global);
            })
            .flat()
            .sort(MinimalImage.compare);
        return [...new Set([...imgs, ...globals])];
    }

    /**
     * Find and return the image attached to this product which has `variant_icon: true` in its `association_metadata`. This
     * shoud be a small and identifiable icon used when displaying this product as variants in a group.
     */
    getVariantIcon(sku: string | number) {
        const prod = this.products.filter((p) => p.sku === sku)[0];
        const variantIcons = prod.images.filter(
            (img) => img.association_metadata?.variant_icon,
        );
        if (variantIcons.length > 0) return variantIcons[0];
        else return this.getCarouselImages(sku)[0];
    }

    /**
     * Truthy if and only if all products in this group are marked as `hidden`.
     */
    isHidden() {
        for (let product of this.products) {
            if (!product.hidden) return false;
        }
        return true;
    }

    hasSku(sku: string | number) {
        return !!this.getProductWithSku(sku);
    }

    getProductWithSku(sku: string | number) {
        return this.products.find(p => p.sku == sku)
    }

    public serialise(): string {
        return JSON.stringify(this);
    }

    static deserialize(str: string): ProductGroup {
        const obj = JSON.parse(str);
        obj.products = obj.products.map((p: any) => ProductData.deserialize(JSON.stringify(p)));
        return Object.assign(Object.create(ProductGroup.prototype), obj);
    }
}

/**
 * A collection of {@link ProductData} and {@link ProductGroup}s.
 */
export class ProductCollection extends Array<ProductData | ProductGroup>{

    public serialise(): string {
        return JSON.stringify(this);
    }

    static deserialise(str: string): ProductCollection {
        const items: any[] = JSON.parse(str);
        const convertedItems: ProductCollection = new ProductCollection();
        items.forEach((p) => {
            if ("groupName" in p) convertedItems.push(ProductGroup.deserialize(JSON.stringify(p)))
            else if ("sku" in p) convertedItems.push(ProductData.deserialize(JSON.stringify(p)))
            else throw new Error("Object type mismatch: " + JSON.stringify(p, undefined, 2));
        })
        return convertedItems;
    }

}