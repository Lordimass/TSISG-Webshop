import {ProductData} from "@shared/types/supabaseTypes.ts";
import {SiteSettingsContext, UnsubmittedProductData} from "@shared/types/types.ts";
import {useContext} from "react";

/**
 * Figure out whether a given product is available to buy, as well as a message if it is not.
 * @param product The product to check.
 */
export function useGetDisabledStatus(product: ProductData | UnsubmittedProductData) {
    const siteSettings = useContext(SiteSettingsContext)
    let disabled: {isDisabled: boolean, message?: string} = {isDisabled: false, message: undefined}
    const disabledMessages = siteSettings.disabled_product_messages

    // Stock
    if (product.stock <= 0) disabled = {isDisabled: true, message: disabledMessages?.out_of_stock}
    // Active
    else if (!product.active) disabled = {isDisabled: true, message: disabledMessages?.disabled}
    // Kill Switch
    else if (siteSettings.kill_switch?.enabled) disabled = {isDisabled: true, message: siteSettings.kill_switch?.message}

    return disabled
}