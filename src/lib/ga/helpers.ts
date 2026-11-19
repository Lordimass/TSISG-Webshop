import {type Currency} from "dinero.js";
import {Basket, BasketProduct, ProductData} from "@/lib";
import {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackAddToCart,
  trackAddToWishlist,
  trackBeginCheckout,
  trackPurchase,
  trackRefund,
  trackRemoveFromCart,
  trackViewCart,
  trackViewItem,
  trackViewItemList,
  trackViewPromotion,
} from "./events";
import {GAItem} from "../types/ga.ts";

/**
 * Wrapper function for {@link trackAddPaymentInfo}. Automatically determines the items and event value from the
 * products in the user's {@link Basket}.
 *
 * @param currency Currency of the items associated with the event.
 * @param payment_type The chosen method of payment.
 * @param coupon The coupon name/code associated with the event. Event-level and item-level coupon parameters are
 * independent.
 */
export function trackAddPaymentInfoWithBasket(
  currency: Currency,
  payment_type?: string,
  coupon?: string,
) {
  const basket = Basket.getBasket();
  trackAddPaymentInfo(
    currency,
    basket.getValue(),
    basket.getGAItems(),
    coupon,
    payment_type,
  );
}

/**
 * Wrapper function for {@link trackAddShippingInfo}. Automatically determines the items and event value from the
 * products in the user's {@link Basket}.
 *
 * @param currency Currency of the items associated with the event.
 * @param shipping_tier The shipping tier (e.g. `Ground`, `Air`, `Next-day`) selected for delivery of the purchased
 * item.
 * @param coupon The coupon name/code associated with the event. Event-level and item-level coupon parameters are
 * independent.
 */
export function trackAddShippingInfoWithBasket(
  currency: Currency,
  shipping_tier?: string,
  coupon?: string,
) {
  const basket = Basket.getBasket();
  trackAddPaymentInfo(
    currency,
    basket.getValue(),
    basket.getGAItems(),
    coupon,
    shipping_tier,
  );
}

/**
 * Wrapper function for {@link trackAddToCart}. Automatically determines the event value from the
 * items supplied.
 *
 * @param currency Currency of the items associated with the event.
 * @param products The products for the event.
 */
export function trackAddToCartAutoValue(
  currency: Currency,
  products: BasketProduct[],
) {
  let value = 0;
  products.forEach((p) => {
    value += p.price * p.basketQuantity;
  });
  trackAddToCart(
    currency,
    value,
    products.map((p) => new GAItem(p)),
  );
}

/**
 * Wrapper function for {@link trackAddToCart} and {@link trackRemoveFromCart}.
 *
 * @param currency Currency of the items associated with the event.
 * @param product The product for this event.
 * @param difference The change in quantity of `product`.
 */
export function trackModifyCart(
  currency: Currency,
  product: ProductData,
  difference: number,
) {
  if (difference > 0) {
    trackAddToCartAutoValue(currency, [
      new BasketProduct(product.sku, difference, product),
    ]);
  } else {
    trackRemoveFromCartAutoValue(currency, [
      new BasketProduct(product.sku, -difference, product),
    ]);
  }
}

/**
 * Wrapper function for {@link trackAddToWishlist}. Automatically determines the event value from the
 * items supplied.
 *
 * @param currency Currency of the items associated with the event.
 * @param products The products for the event.
 */
export function trackAddToWishlistAutoValue(
  currency: Currency,
  products: BasketProduct[],
) {
  let value = 0;
  products.forEach((p) => {
    value += p.price * p.basketQuantity;
  });
  trackAddToWishlist(
    currency,
    value,
    products.map((p) => new GAItem(p)),
  );
}

/**
 * Wrapper function for {@link trackBeginCheckout}. Automatically determines the items and event value from the
 * products in the user's {@link Basket}.
 *
 * @param currency Currency of the items associated with the event.
 * @param coupon The coupon name/code associated with the event. Event-level and item-level coupon parameters are
 * independent.
 */
export function trackBeginCheckoutWithBasket(
  currency: Currency,
  coupon?: string,
) {
  const basket = Basket.getBasket();
  trackBeginCheckout(currency, basket.getValue(), basket.getGAItems(), coupon);
}

/**
 * Wrapper function for {@link trackPurchase}. Automatically determines the items and event value from the
 * products in the user's {@link Basket}. Note that typically tax will be included in the prices of items, so if a value
 * is provided for `tax`, it will be subtracted from the calculated value of the products as this should not include
 * tax if possible.
 *
 * @param currency Currency of the items associated with the event.
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
export function trackPurchaseWithBasket(
  currency: Currency,
  transaction_id: string,
  customer_type?: "new" | "returning",
  coupon?: string,
  shipping?: number,
  tax?: number,
) {
  const basket = Basket.getBasket();
  trackPurchase(
    currency,
    basket.getValue(),
    basket.getGAItems(),
    transaction_id,
    customer_type,
    coupon,
    shipping,
    tax,
  );
}

/**
 * Wrapper function for {@link trackPurchase}. Automatically determines the event value from the items supplied. Note
 * that typically tax will be included in the prices of items, so if a value is provided for `tax`, it will be
 * subtracted from the calculated value of the products as this should not include tax if possible.
 *
 * @param products The products associated with the transaction.
 * @param currency Currency of the items associated with the event.
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
export function trackPurchaseAutoValue(
  products: BasketProduct[],
  currency: Currency,
  transaction_id: string,
  customer_type?: "new" | "returning",
  coupon?: string,
  shipping?: number,
  tax?: number,
) {
  let value = 0;
  products.forEach((p) => (value += p.price * p.basketQuantity));
  if (tax) {
    value -= tax;
  }
  trackPurchase(
    currency,
    value,
    products.map((p) => new GAItem(p)),
    transaction_id,
    customer_type,
    coupon,
    shipping,
    tax,
  );
}

/**
 * Wrapper function for {@link trackRefund}. Automatically determines the event value from the items supplied. Note
 * that typically tax will be included in the prices of items, so if a value is provided for `tax`, it will be
 * subtracted from the calculated value of the products as this should not include tax if possible.
 *
 * @param products The products associated with the transaction.
 * @param currency Currency of the items associated with the event.
 * @param transaction_id The unique identifier of a transaction.
 *
 * The transaction_id parameter helps you avoid getting duplicate events for a purchase.
 * @param coupon The coupon name/code associated with the event.
 *
 * Event-level and item-level coupon parameters are independent.
 * @param shipping Shipping cost associated with a transaction.
 * @param tax Tax cost associated with a transaction.
 */
export function trackRefundAutoValue(
  products: BasketProduct[],
  currency: Currency,
  transaction_id: string,
  coupon?: string,
  shipping?: number,
  tax?: number,
) {
  let value = 0;
  products.forEach((p) => (value += p.price * p.basketQuantity));
  if (tax) {
    value -= tax;
  }
  trackRefund(
    currency,
    value,
    products.map((p) => new GAItem(p)),
    transaction_id,
    coupon,
    shipping,
    tax,
  );
}

/**
 * Wrapper function for {@link trackRemoveFromCart}. Automatically determines the event value from the
 * items supplied.
 *
 * @param currency Currency of the items associated with the event.
 * @param products The products for the event.
 */
export function trackRemoveFromCartAutoValue(
  currency: Currency,
  products: BasketProduct[],
) {
  let value = 0;
  products.forEach((p) => {
    value += p.price * p.basketQuantity;
  });
  trackRemoveFromCart(
    currency,
    value,
    products.map((p) => new GAItem(p)),
  );
}

/**
 * Wrapper function for {@link trackViewCart}. Automatically determines the items and event value from the
 * products in the user's {@link Basket}.
 *
 * @param currency Currency of the items associated with the event.
 */
export function trackViewCartWithBasket(currency: Currency) {
  const basket = Basket.getBasket();
  trackViewCart(currency, basket.getValue(), basket.getGAItems());
}

/**
 * Wrapper function for {@link trackViewItem}. Automatically converts the product to a GA4 item.
 *
 * @param currency Currency of the items associated with the event.
 * @param product The product for the event.
 */
export function trackViewItemAutoConvert(
  currency: Currency,
  product: ProductData,
) {
  trackViewItem(currency, product.price, new GAItem(product));
}

/**
 * Wrapper function for {@link trackViewItemList}. Automatically converts products to GA4 items.
 *
 * @param currency Currency of the items associated with the event.
 * @param products Products for the event.
 * @param item_list_id The ID of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 * @param item_list_name The name of the list in which the item was presented to the user.
 *
 * Ignored if set at the item-level.
 */
export function trackViewItemListAutoConvert(
  currency: Currency,
  products: BasketProduct[] | ProductData[],
  item_list_id?: string,
  item_list_name?: string,
) {
  trackViewItemList(
    currency,
    products.map((p) => new GAItem(p)),
    item_list_id,
    item_list_name,
  );
}

/**
 * Wrapper function for {@link trackViewPromotion}. Automatically converts products to GA4 items.
 *
 * @param product Product for the event.
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
export function trackViewPromotionAutoConvert(
  product: ProductData,
  creative_name?: string,
  creative_slot?: string,
  promotion_id?: string,
  promotion_name?: string,
) {
  trackViewPromotion(
    new GAItem(product),
    creative_name,
    creative_slot,
    promotion_id,
    promotion_name,
  );
}
