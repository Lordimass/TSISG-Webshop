import Stripe from "stripe";
type AllowedCountry = Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry;

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "UK Zone" */
export const UK: AllowedCountry[] = [
    "GB", "GG", "JE", "IM"
]

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "Europe Zone 1",
 * "Europe Zone 2", & "Europe Zone 3" */
export const EU: AllowedCountry[] = [
    "IE", "FR", "DE", "FR", "DK", "MC", "AT", "LV", "PT", "LT", "ES", "LU", "BE", "PT", "BG", "MT", "NL", "HR", "PL",
    "CY", "PT", "CZ", "RO", "EE", "SK", "FI", "SI", "GR", "HU", "SE", "IT", "AL", "MD", "AD", "ME", "AM", "MK", "AZ",
    "NO", "BY", "RU", "BA", "SM", "FO", "RS", "GE", "CH", "GI", "TJ", "GL", "TR", "IS", "TM", "KZ", "UA", "XK", "UZ",
    "KG", "VA", "LI"
]

/** A list of ISO alpha-2 country codes corresponding to countries classified as part of Royal Mail's "World Zone 1",
 * "World Zone 2", & "World Zone 3" */
export const WORLD: AllowedCountry[] = [
    'AC', 'AE', 'AG', 'AI', 'AO', 'AQ', 'AR', 'AU', 'AW', 'AX', 'BB', 'BD', 'BF', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN',
    'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR',
    'CV', 'CW', 'DJ', 'DM', 'DO', 'DZ', 'EC', 'EG', 'EH', 'ER', 'ET', 'FJ', 'FK', 'GA', 'GD', 'GF', 'GH', 'GM', 'GN',
    'GP', 'GQ', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HN', 'HT', 'ID', 'IL', 'IN', 'IO', 'IQ', 'JM', 'JO', 'JP', 'KE',
    'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'LA', 'LB', 'LC', 'LK', 'LR', 'LS', 'LY', 'MA', 'MF', 'MG', 'ML', 'MM',
    'MN', 'MO', 'MQ', 'MR', 'MS', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NP', 'NR', 'NU',
    'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PM', 'PN', 'PR', 'PS', 'PY', 'QA', 'RE', 'RW', 'SA', 'SB', 'SC',
    'SD', 'SG', 'SH', 'SJ', 'SL', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH',
    'TK', 'TL', 'TN', 'TO', 'TT', 'TV', 'TW', 'TZ', 'UG', 'US', 'UY', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'YE',
    'YT', 'ZA', 'ZM', 'ZW', 'ZZ'
]

/** A list of ISO alpha-2 country codes corresponding to countries which we can ship to */
export const SHIPPING_COUNTRIES: AllowedCountry[] = [...UK, ...EU, ...WORLD]