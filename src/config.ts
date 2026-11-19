import {getCurrency} from "locale-currency";
import type {Currency} from "dinero.js";
import type {Locale} from "@/lib";
import type {RemoteSettings} from "./lib/types/remoteSettings.ts";

/*============================== LOCALE ==============================*/
const DEFAULT_LOCALE_STRING: string = "en-GB";
const DEFAULT_CURRENCY: Currency = (getCurrency(DEFAULT_LOCALE_STRING) as Currency) || "GBP";
const DEFAULT_COUNTRY: string = DEFAULT_LOCALE_STRING.split("-")[1];
export const DEFAULT_LOCALE: Locale = {
    locale: DEFAULT_LOCALE_STRING,
    currency: DEFAULT_CURRENCY,
    country: DEFAULT_COUNTRY
};

/*============================== PRODUCTS ==============================*/
export const MAX_PRODUCT_ORDER: number = 10

/*============================== REMOTE SETTINGS ==============================*/
export const DEFAULT_REMOTE_SETTINGS: RemoteSettings = {}

/*============================== DISABLED PRODUCT IMAGES ==============================*/
export const DISABLED_PRODUCT_MESSAGE = "This product isn't available to buy right now, sorry!"
export const DISABLED_PRODUCT_OUT_OF_STOCK_MESSAGE = "We're out of stock, sorry!"