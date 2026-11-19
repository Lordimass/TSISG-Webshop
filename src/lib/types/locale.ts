import type {Currency} from "dinero.js";
import {getCurrency} from "locale-currency";
import {DEFAULT_LOCALE} from "../../config.ts";

/**
 * Response format from a successful call to `https://api.bigdatacloud.net/data/reverse-geocode-client`
 */
interface GeocodeResponse {
  /** Estimated latitude of the requester */
  latitude: number;
  /** The method used to obtain this data
   * @example "ip geolocation" */
  lookupSource: string;
  /** Estimated longitude of the requester */
  longitude: number;
  /** The locality language requested
   * @example "en"
   */
  localityLanguageRequested: string;
  /** The continent of the requester */
  continent: string;
  /** Short code for the continent of the requester */
  continentCode: string;
  /** Full, official name of the country of the requester
   * @example "United Kingdom of Great Britain and Northern Ireland (the)"*/
  countryName: string;
  /** Short code for the country of the requester */
  countryCode: string;
  /** The principal subdivision of the location of the requester
   * @example "England" */
  principalSubdivision: string;
  /** Short code for the principal subdivision of the location of the requester */
  principalSubdivisionCode: string;
  /** Estimated city of the requester */
  city: string;
  /** Estimated locality of the requester
   * @example "York"
   */
  locality: string;
  /** Estimated short postcode of the requester
   * @example "YO31 0"*/
  postCode: string;
  /** Estimated pluscode of the requester
   * @example 9C5WXW5R+X2 */
  plusCode: string;
  /** Lots of aditional information, type not specific because it's likely not useful for this application. */
  localityInfo: Object;
}

export interface Locale {
  /**
   * BCP47 Language Tag
   * @example "en-GB"
   */
  locale: string;
  /**
   * ISO4217 Currency Code
   * @example "GBP"
   */
  currency: Currency;
  /**
   * ISO3166-1 alpha-2 Country Code
   * @example "GB"
   */
  country: string;
}

/**
 * Determine the user's locale from the URL query string or IP geolocation.
 *
 * Must be called from the client!
 */
export default async function determineUserLocale(): Promise<Locale> {
  let currency = DEFAULT_LOCALE.currency;
  let country = DEFAULT_LOCALE.country;

  const url = new URL(window.location.href);
  const urlParams = new URLSearchParams(window.location.search);
  let locale = urlParams.get("locale");
  if (!locale) {
    // Estimate user location based on IP and update query string on URL to match
    // NOTE: Not using window.navigator.language because this may, for example, be set to en-US for UK
    // users. Situations like this would lead to the wrong currency being displayed.
    const resp = await fetch(
        "https://api.bigdatacloud.net/data/reverse-geocode-client",
    );
    if (!resp.ok) {
      console.error("Couldn't find locale: " + (await resp.text()));
      locale = window.navigator.language;
      currency = (getCurrency(locale) as Currency) || DEFAULT_LOCALE.currency;
    } else {
      const geocodeResponse: GeocodeResponse = await resp.json();
      locale = geocodeResponse.localityLanguageRequested + "-" + geocodeResponse.countryCode;
      currency = (getCurrency(locale) as Currency) || DEFAULT_LOCALE.currency;
    }

    url.searchParams.set("locale", locale);
    window.history.replaceState(null, "", url);
  } else {
    currency = (getCurrency(locale) as Currency) || DEFAULT_LOCALE.currency;
    country = locale.split("-")[1];
  }

  return {locale, currency, country}
}