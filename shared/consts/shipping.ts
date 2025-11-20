import Stripe from "stripe";
export type AllowedCountry = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "UK Zone" */
export const UK: AllowedCountry[] = [
    "GB", "GG", "JE", "IM"
]
/** ISO alpha-2 country codes corresponding to countries in the UK Zone that cannot currently be shipped to */
const DISALLOWED_UK: AllowedCountry[] = []

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "Europe Zone 1",
 * "Europe Zone 2", & "Europe Zone 3" */
export const EU: AllowedCountry[] = [
    "IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL",
    "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "MK", "NO", "BA",
    "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "XK", "UZ", "KG", "VA", "LI"
]
/** ISO alpha-2 country codes corresponding to countries in Europe Zones that cannot currently be shipped to */
const DISALLOWED_EU: AllowedCountry[] = [
    "AZ", "AM", "BY", "RU", "UA"
]

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "World Zone 1",
 * "World Zone 2", & "World Zone 3" */
export const WORLD: AllowedCountry[] = [
    'AC', 'AE', 'AG', 'AI', 'AO', 'AQ', 'AR', 'AU', 'AW', 'AX', 'BB', 'BD', 'BF', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN',
    'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BZ', 'CA', 'CD', 'CF', 'CK', 'CL', 'CM', 'CO', 'CR', 'CV', 'CW', 'DJ',
    'DM', 'DO', 'DZ', 'EC', 'EH', 'ET', 'FJ', 'FK', 'GA', 'GD', 'GF', 'GH', 'GM', 'GP', 'GQ', 'GS', 'GT', 'GU', 'GW',
    'GY', 'HK', 'HN', 'ID', 'IL', 'IN', 'IO', 'JM', 'JO', 'JP', 'KE', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'LA',
    'LC', 'LK', 'LS', 'MA', 'MF', 'MG', 'ML', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA',
    'NC', 'NE', 'NG', 'NI', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PM', 'PN', 'PR', 'PS',
    'PY', 'QA', 'RE', 'RW', 'SA', 'SB', 'SC', 'SG', 'SH', 'SJ', 'SN', 'SR', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD',
    'TF', 'TG', 'TH', 'TK', 'TL', 'TO', 'TT', 'TV', 'TW', 'TZ', 'UG', 'US', 'UY', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF',
    'WS', 'YE', 'YT', 'ZA', 'ZM', 'ZZ'
]
/** ISO alpha-2 country codes corresponding to countries in World Zones that cannot currently be shipped to */
const DISALLOWED_WORLD: AllowedCountry[] = [
    'MM', 'CN', 'CG', 'EG', 'ER', 'GN', 'HT', 'IQ', 'CI', 'LB', 'LR', 'LY', 'SL', 'SO', 'SS', 'SD', 'TN', 'ZW'
]

/** A list of ISO alpha-2 country codes corresponding to countries which we can ship to */
export const SHIPPING_COUNTRIES: AllowedCountry[] = [...UK, ...EU, ...WORLD]