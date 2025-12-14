/**
 * Paths to pages
 */
const PATHS = {
    HOME: "/",
    CHECKOUT: "/checkout",
    POST_CHECKOUT: "/thankyou",
    LOGIN: "/login",

    // Staff pages
    ORDERS: "/staff/orders",
    REPORTS: "/staff/reports",

    // Policies
    PRIVACY_POLICY: "/privacy",
    RETURNS_POLICY: "/returns",
    CANCELLATIONS_POLICY: "/cancellations",
    SHIPPING_POLICY: "/shipping",
}

/**
 * Routes for the Browser Router
 */
const ROUTES = {
    ...PATHS,
    REPORT: "/staff/reports/*",
    PRODUCT: "/products/*",
    REFUNDS_POLICY: "/refunds",
    "404": "*"
}

/**
 * Get the path route for the BrowserRouter for a given page of the site.
 * @param page The page to fetch a route for.
 * @returns The path to the page requested.
 * @example "/products/*"
 */
export function getRoute(
    page: keyof typeof ROUTES
) {
    return ROUTES[page]
}

/**
 * Get the relative path to a page on the site.
 * @param page The page to fetch a path for.
 * @param maintainQueryString Whether to preserve the current search parameters in the path.
 * @returns The relative path to the page requested.
 * @example "/checkout"
 * @example "/checkout?locale=en-GB"
 */
export function getPath(
    page: keyof typeof PATHS,
    maintainQueryString = true
) {
    const url = new URL(window.location.href)
    url.pathname = PATHS[page]
    return url.pathname+(maintainQueryString ? url.search : "")
}

/**
 * Get the relative path to a product page. Does not check whether that product actually exists.
 * @param sku The sku of the product to fetch a path for.
 * @param maintainQueryString Whether to preserve the current search parameters in the path.
 * @returns The relative path to the page requested.
 * @example "/products/1"
 * @example "/products/1?locale=en-GB"
 */
export function getProductPagePath(
    sku: number,
    maintainQueryString = true
) {
    const url = new URL(window.location.href)
    url.pathname = `/products/${sku}`
    return url.pathname+(maintainQueryString ? url.search : "")
}

/**
 * Get the relative path to a report page. Does not check whether that report actually exists.
 * @param id The id of the report to fetch a path for.
 * @param maintainQueryString Whether to preserve the current search parameters in the path.
 * @returns The relative path to the page requested.
 * @example "/reports/1"
 * @example "/reports/1?locale=en-GB"
 */
export function getReportPagePath(
    id: number,
    maintainQueryString = true
) {
    const url = new URL(window.location.href)
    url.pathname = `/staff/reports/${id}`
    return url.pathname+(maintainQueryString ? url.search : "")
}