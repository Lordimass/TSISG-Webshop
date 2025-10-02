export type GA4Product = {
    /** The ID of the item. */
    item_id: string
    /** The name of the item. */
    item_name: string
    /**
     * A product affiliation to designate a supplying company or brick and mortar store location. 
     * Note: `affiliation` is only available at the item-scope. 
    */
    affiliation?: string
    /**
     * The coupon name/code associated with the item.
     * Event-level and item-level coupon parameters are independent.
    */
    coupon?: string
    /** The unit monetary discount value associated with the item. */
    discount?: number
    /** The index/position of the item in a list. */
    index?: number
    /** The brand of the item. */
    item_brand?: string
    /** The category of the item. If used as part of a category hierarchy or taxonomy then this will be the first category. */
    item_category?: string
    /** The second category hierarchy or additional taxonomy for the item. */
    item_category2?: string
    /** The third category hierarchy or additional taxonomy for the item. */
    item_category3?: string
    /** The fourth category hierarchy or additional taxonomy for the item. */
    item_category4?: string
    /** The fifth category hierarchy or additional taxonomy for the item. */
    item_category5?: string
    /** The ID of the list in which the item was presented to the user.
     * 
     * If set, event-level item_list_id is ignored.
     * If not set, event-level item_list_id is used, if present. 
    */
    item_list_id?: string
    /**
     * The name of the list in which the item was presented to the user.
     * 
     * If set, event-level item_list_name is ignored.
     * If not set, event-level item_list_name is used, if present.
     */
    item_list_name?: string
    /** The item variant or unique code or description for additional item details/options. */
    item_variant?: string
    /** 
     * The physical location associated with the item (e.g. the physical store location). It's recommended to use the Google Place ID that corresponds to the associated item. A custom location ID can also be used.
     * Note: `location id` is only available at the item-scope. 
    */
    location_id?: string
    /** 
     * The monetary unit price of the item, in units of the specified currency parameter. 
     * If a discount applies to the item, set price to the discounted unit price and specify the unit price discount in the discount parameter. 
    */
    price?: number
    /**
     * Item quantity.
     * If not set, quantity is set to 1.
     */
    quantity?: number
}