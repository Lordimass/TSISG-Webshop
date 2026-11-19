import {BasketProduct, ProductData, ProductGroup,} from "@/lib";

/**
 * A product used in Google Analytics events.
 *
 * Interpreted from the [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_payment_info_item)
 */
export interface GAItem {
    /**
     * The ID of the item.
     * <br/>
     * *One of item\_id or item\_name is required.
     */
    item_id?: string;
    /**
     * The name of the item.
     * <br/>
     * *One of item\_id or item\_name is required.
     */
    item_name?: string;
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location.
     * <br/>
     * Note: `affiliation` is only available at the item-scope.
     */
    affiliation?: string;
    /**
     * The coupon name/code associated with the item.
     * <br/>
     * Event-level and item-level coupon parameters are independent.
     */
    coupon?: string;
    /**
     * The name of the promotional creative.
     * <br/>
     * If set, event-level `creative_name` is ignored.
     * If not set, event-level `creative_name` is used, if present.
     */
    creative_name?: string;
    /**
     * The name of the promotional creative slot associated with the item.
     * <br/>
     * If set, event-level `creative_slot` is ignored.
     * If not set, event-level `creative_slot` is used, if present.
     */
    creative_slot?: string;
    /** The unit monetary discount value associated with the item. */
    discount?: number;
    /** The index/position of the item in a list. */
    index?: number;
    /** The brand of the item. */
    item_brand?: string;
    /**
     * The category of the item. If used as part of a category hierarchy or taxonomy then this will be the first
     * category.
     */
    item_category?: string;
    /** The second category hierarchy or additional taxonomy for the item. */
    item_category2?: string;
    /** The third category hierarchy or additional taxonomy for the item. */
    item_category3?: string;
    /** The fourth category hierarchy or additional taxonomy for the item. */
    item_category4?: string;
    /** The fifth category hierarchy or additional taxonomy for the item. */
    item_category5?: string;
    /**
     * The ID of the list in which the item was presented to the user.
     * <br/>
     * If set, event-level `item_list_id` is ignored.
     * <br/>
     * If not set, event-level `item_list_id` is used, if present.
     */
    item_list_id?: string;
    /**
     * The name of the list in which the item was presented to the user.
     * <br/>
     * If set, event-level `item_list_name` is ignored.
     * <br/>
     * If not set, event-level `item_list_name` is used, if present.
     */
    item_list_name?: string;
    /**
     * The item variant or unique code or description for additional item details/options.
     */
    item_variant?: string;
    /**
     * The physical location associated with the item (e.g. the physical store location). It's recommended to use the
     * Google Place ID that corresponds to the associated item. A custom location ID can also be used.
     * <br/>
     * **Note:** `location_id` is only available at the item-scope.
     */
    location_id?: string;
    /**
     * The monetary unit price of the item, in units of the specified currency parameter. If a discount applies to the
     * item, set price to the discounted unit price and specify the unit price discount in the discount parameter.
     */
    price?: number;
    /**
     * Item quantity.
     * <br/>
     * If not set, `quantity` is set to 1.
     */
    quantity?: number;
}

/**
 * A product used in Google Analytics events.
 *
 * Interpreted from the [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#add_payment_info_item)
 */
export class GAItem {
    /** Construct a Google Analytics item from {@link ProductData}*/
    constructor(
        product: ProductData | BasketProduct | ProductGroup,
        overrides?: Partial<GAItem>,
    ) {
        if (product instanceof ProductGroup) {
            this.item_id = "" + product.products[0].sku;
            this.item_name = product.groupName;
            this.price = product.products[0].price;
            return;
        } else if (product instanceof BasketProduct) {
            this.quantity = product.basketQuantity;
        }
        this.item_id = "" + product.sku;
        this.item_name = product.groupName ?? product.name;
        this.item_variant = product.groupName ? product.name : undefined;
        this.price = product.price;
        this.item_category = product.metadata.category ?? undefined;

        if (overrides) {
            this.item_id = overrides.item_id;
            this.item_name = overrides.item_name;
            this.affiliation = overrides.affiliation;
            this.creative_name = overrides.creative_name;
            this.creative_slot = overrides.creative_slot;
            this.discount = overrides.discount;
            this.index = overrides.index;
            this.item_brand = overrides.item_brand;
            this.item_category = overrides.item_category;
            this.item_category2 = overrides.item_category2;
            this.item_category3 = overrides.item_category3;
            this.item_list_id = overrides.item_list_id;
            this.item_list_name = overrides.item_list_name;
            this.item_variant = overrides.item_variant;
            this.location_id = overrides.location_id;
            this.price = overrides.price;
            this.quantity = overrides.quantity;
        }
    }
}
