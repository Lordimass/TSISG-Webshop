import {GAItem as Item} from "../types/ga.ts";
import {sendGAEvent} from "@next/third-parties/google";

function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
    if (eventParams) {
        sendGAEvent("event", eventName, eventParams);
    } else {
        sendGAEvent("event", eventName)
    }
}

/**
 * Records a user viewing a page.
 *
 * **Caution:** If you send manual pageviews without disabling pageview measurement, you may end up with duplicate
 * pageviews.
 *
 * Whenever someone loads a page of your website or their browser history state is
 * changed by the active site, an enhanced measurement event called page_view is sent from your website to Google
 * Analytics. Since the event is sent automatically, you don't need to send pageview data to Analytics manually.
 *
 * However, when you want to manually control how pageviews are sent (e.g. single-page applications or infinite
 * scrolling), you can disable pageviews and then manually send them from your website.
 *
 * @param page_location - The URL of the page. The value must start with the protocol followed by the full URL; for
 * example, https://www.example.com/contact-us-submitted. Defaults to `document.title`
 * @param page_title - The title of the page. Defaults to `location.href`
 */
export function trackPageView(
    page_title = document.title,
    page_location = location.href,
) {
    trackEvent("page_view", { page_location, page_title });
}

/**
 * This event measures when a user is awarded virtual currency in a game. Log this along with
 * {@link trackSpendVirtualCurrency} to better understand your virtual economy.
 * @param virtual_currency_name The name of the virtual currency.
 * @param value The value of the virtual currency.
 * @example trackEarnVirtualCurrency("Gems", 5)
 */
export function trackEarnVirtualCurrency(
    virtual_currency_name?: string,
    value?: number,
) {
    trackEvent("earn_virtual_currency", { virtual_currency_name, value });
}

/**
 * Log this event when a user joins a group such as a guild, team, or family. Use this event to analyze how popular
 * certain groups or social features are.
 *
 * @param group_id The ID of the group.
 */
export function trackJoinGroup(group_id?: string) {
    trackEvent("join_group", { group_id });
}

/**
 * Send this event to signify that a user has logged in to your website or app.
 *
 * @param method The method used to log in.
 */
export function trackLogin(method?: string) {
    trackEvent("login", { method });
}

/**
 * Log this event to indicate when the user has performed a search. You can use this event to identify what users are
 * searching for on your website or app. For example, you could send this event when a user views a search results page
 * after performing a search.
 *
 * @param search_term The term that was searched for.
 */
export function trackSearch(search_term?: string) {
    trackEvent("search", { search_term });
}

/**
 * This event signifies that a user has selected some content of a certain type. This event can help you identify
 * popular content and categories of content on your website or app.
 *
 * @param content_type The type of selected content.
 * @param content_id An identifier for the content that was selected.
 * @example trackSelectContent("product", "C_12345")
 */
export function trackSelectContent(content_type: string, content_id: string) {
    trackEvent("select_content", { content_type, content_id });
}

/**
 * Use this event when a user has shared content.
 *
 * @param method The method in which the content is shared.
 * @param content_type The type of shared content.
 * @param item_id The ID of the shared content.
 * @example trackShare("Twitter", "image", "C_12345")
 */
export function trackShare(
    method?: string,
    content_type?: string,
    item_id?: string,
) {
    trackEvent("share", { method, content_type, item_id });
}

/**
 * This event indicates that a user has signed up for an account. Use this event to understand the different behaviors
 * of logged in and logged-out users.
 * @param method The method used for sign up.
 */
export function trackSignUp(method?: string) {
    trackEvent("signup", { method });
}

/**
 * This event measures the sale of virtual goods in your app and helps you identify which virtual goods are the most
 * popular.
 * @param value The value of the virtual currency.
 * @param virtual_currency_name The name of the virtual currency.
 * @param item_name The name of the item the virtual currency is being used for.
 * @example trackSpendVirtualCurrency(5, "Gems", "Starter Boost")
 */
export function trackSpendVirtualCurrency(
    value: number,
    virtual_currency_name: string,
    item_name?: string,
) {
    trackEvent("spend_virtual_currency", {
        virtual_currency_name,
        value,
        item_name,
    });
}

/**
 * This event signifies the start of the on-boarding process. Use this in a funnel with {@link trackTutorialComplete}
 * to understand how many users complete the tutorial.
 */
export function trackTutorialBegin() {
    trackEvent("tutorial_begin");
}

/**
 * This event signifies the user's completion of your on-boarding process. Use this in a funnel with
 * {@link trackTutorialBegin} to understand how many users complete the tutorial.
 */
export function trackTutorialComplete() {
    trackEvent("tutorial_complete");
}

/**
 * This event signifies a user has submitted their payment information in an ecommerce checkout process.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level coupon parameters are independent.
 * @param payment_type The chosen method of payment.
 */
export function trackAddPaymentInfo(
    currency: string,
    value: number,
    items: Item[],
    coupon?: string,
    payment_type?: string,
) {
    trackEvent("add_payment_info", {
        currency,
        value,
        items,
        coupon,
        payment_type,
    });
}

/**
 * This event signifies a user has submitted their shipping information in an ecommerce checkout process.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level `coupon` parameters are independent.
 * @param shipping_tier The shipping tier (e.g. `Ground`, `Air`, `Next-day`) selected for delivery of the purchased
 * item.
 */
export function trackAddShippingInfo(
    currency: string,
    value: number,
    items: Item[],
    coupon?: string,
    shipping_tier?: string,
) {
    trackEvent("add_shipping_info", {
        currency,
        value,
        items,
        coupon,
        shipping_tier,
    });
}

/**
 * This event signifies that an item was added to a cart for purchase.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 */
export function trackAddToCart(currency: string, value: number, items: Item[]) {
    trackEvent("add_to_cart", { currency, value, items });
}

/**
 * The event signifies that an item was added to a wishlist. Use this event to identify popular gift items in your app.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 */
export function trackAddToWishlist(
    currency: string,
    value: number,
    items: Item[],
) {
    trackEvent("add_to_wishlist", { currency, value, items });
}

/**
 * This event signifies that a user has begun a checkout.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level coupon parameters are independent.
 */
export function trackBeginCheckout(
    currency: string,
    value: number,
    items: Item[],
    coupon?: string,
) {
    trackEvent("begin_checkout", { currency, value, items, coupon });
}

/**
 * This event signifies when one or more items is purchased by a user.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 * @param transaction_id The unique identifier of a transaction.
 *
 * The transaction_id parameter helps you avoid getting duplicate events for a purchase.
 * @param customer_type Is the conversion from a `new` or `returning` customer?
 *
 * - `new`: New customer who hasn't purchased within a given time period (540-day window recommended and set at default, but not required).
 * - `returning`: A returning customer who has purchased during the given time period.
 *
 * Don't specify a value if there's uncertainty (for example, if the user checked out as a guest).
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level coupon parameters are independent.
 * @param shipping Shipping cost associated with a transaction.
 * @param tax Tax cost associated with a transaction.
 */
export function trackPurchase(
    currency: string,
    value: number,
    items: Item[],
    transaction_id: string,
    customer_type?: "new" | "returning",
    coupon?: string,
    shipping?: number,
    tax?: number,
) {
    trackEvent("purchase", {
        currency,
        value,
        items,
        transaction_id,
        customer_type,
        coupon,
        shipping,
        tax,
    });
}

/**
 * This event signifies when one or more items is refunded to a user.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 * @param transaction_id The unique identifier of a transaction.
 *
 * The transaction_id parameter helps you avoid getting duplicate events for a purchase.
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level coupon parameters are independent.
 * @param shipping Shipping cost associated with a transaction.
 * @param tax Tax cost associated with a transaction.
 */
export function trackRefund(
    currency: string,
    value: number,
    items: Item[],
    transaction_id: string,
    coupon?: string,
    shipping?: number,
    tax?: number,
) {
    trackEvent("refund", {
        currency,
        value,
        items,
        transaction_id,
        coupon,
        shipping,
        tax,
    });
}

/**
 * This event signifies that an item was removed from a cart.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 */
export function trackRemoveFromCart(
    currency: string,
    value: number,
    items: Item[],
) {
    trackEvent("remove_from_cart", { currency, value, items });
}

/**
 * This event signifies an item was selected from a list.
 * @param item The item for the event
 * @param item_list_id The ID of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 * @param item_list_name The name of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 */
export function trackSelectItem(
    item: Item,
    item_list_id?: string,
    item_list_name?: string,
) {
    trackEvent("select_item", { items: [item], item_list_id, item_list_name });
}

/**
 * This event signifies a promotion was selected from a list.
 *
 * @param creative_name The name of the promotional creative.
 *
 * Ignored if set at the item-level.
 * @param creative_slot The name of the promotional creative slot associated with the event.
 *
 * Ignored if set at the item-level.
 * @param promotion_id The ID of the promotion associated with the event.
 *
 * Ignored if set at the item-level.
 * @param promotion_name The name of the promotion associated with the event.
 *
 * Ignored if set at the item-level.
 * @param items The items for the event.
 */
export function trackSelectPromotion(
    creative_name?: string,
    creative_slot?: string,
    promotion_id?: string,
    promotion_name?: string,
    items?: Item[],
) {
    trackEvent("select_promotion", {
        creative_name,
        creative_slot,
        promotion_id,
        promotion_name,
        items,
    });
}

/**
 * This event signifies that a user viewed their cart.
 *
 * This event signifies that an item was removed from a cart.
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param items The items for the event.
 */
export function trackViewCart(currency: string, value: number, items: Item[]) {
    trackEvent("view_cart", { currency, value, items });
}

/**
 * This event signifies that some content was shown to the user. Use this event to discover the most popular items viewed.
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param value The monetary value of the event.
 *
 * Set `value` to the sum of (price * quantity) for all items in items. Don't include shipping or tax.
 *
 * `value` is typically required for meaningful reporting. If you mark the event as a key event then it's recommended
 * you set value.
 *
 * `currency` is required if you set value.
 * @param item The item for the event.
 */
export function trackViewItem(currency: string, value: number, item: Item) {
    trackEvent("view_item", { currency, value, items: [item] });
}

/**
 *
 * @param currency Currency of the items associated with the event, in
 * [3-letter ISO 4217](https://en.wikipedia.org/wiki/ISO_4217#Active_codes) format.
 *
 * Value metrics on the `view_item` event to not contribute to revenue
 *
 * If you set `value` then `currency` is required for revenue metrics to be computed accurately.
 * @param items The items for the event
 * @param item_list_id The ID of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 * @param item_list_name The name of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 */
export function trackViewItemList(
    currency: string,
    items: Item[],
    item_list_id?: string,
    item_list_name?: string,
) {
    trackEvent("view_item_list", {
        currency,
        items,
        item_list_id,
        item_list_name,
    });
}

/**
 * This event signifies a promotion was viewed from a list.
 *
 * @param item The item for the event
 * @param creative_name The name of the promotional creative.
 *
 * Ignored if set at the item-level.
 * @param creative_slot The name of the promotional creative slot associated with the event.
 *
 * Ignored if set at the item-level.
 * @param promotion_id The ID of the promotion associated with the event.
 *
 * Ignored if set at the item-level.
 * @param promotion_name The name of the promotion associated with the event.
 *
 * Ignored if set at the item-level.
 */
export function trackViewPromotion(
    item: Item,
    creative_name?: string,
    creative_slot?: string,
    promotion_id?: string,
    promotion_name?: string,
) {
    trackEvent("view_promotion", {
        items: [item],
        creative_name,
        creative_slot,
        promotion_id,
        promotion_name,
    });
}

// TODO: Add Lead Generation Events - https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtag#lead_generation
