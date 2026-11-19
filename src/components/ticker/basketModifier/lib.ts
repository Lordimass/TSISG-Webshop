"use client";

import {useContext} from "react";
import type {MinimalProduct} from "../../../lib";
import {DISABLED_PRODUCT_MESSAGE, DISABLED_PRODUCT_OUT_OF_STOCK_MESSAGE} from "../../../config.ts";
import {RemoteSettingsContext} from "../../../lib/context/remoteSettings.tsx";
/**
 * Figure out whether a given product is available to buy, as well as a message if it is not.
 * @param product The product to check.
 */
export function useGetDisabledStatus(product: MinimalProduct) {
  const siteSettings = useContext(RemoteSettingsContext);
  let disabled: { isDisabled: boolean; message?: string } = {
    isDisabled: false,
    message: undefined,
  };

  // Kill Switch
  if (siteSettings.kill_switch?.enabled)
    disabled = { isDisabled: true, message: siteSettings.kill_switch?.message };
  // Active
  else if (product.active == false)
    disabled = { isDisabled: true, message: DISABLED_PRODUCT_MESSAGE };
  // Stock
  else if (typeof product.stock === "number" && product.stock <= 0)
    disabled = { isDisabled: true, message: DISABLED_PRODUCT_OUT_OF_STOCK_MESSAGE };
  return disabled;
}
