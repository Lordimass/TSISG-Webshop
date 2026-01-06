import { JSX } from "react"


// TODO: Merge canonical, metaDescription, & noindex into one object param with each of these keys
// TODO: Merge loadCondition & loadingText into one object param with each of these keys.
export type PageParams = {
    children?: JSX.Element[] | JSX.Element
    /** The ID of the div holding the page content */
    id?: string
    /** Canonical URL for the page, will be embedded in the page header. */
    canonical?: string
    /** Whether to tell Googlebot not to index this page. */
    noindex?: boolean
    /** The title of the page, written on the tab next to the favicon. */
    title?: string
    /** Whether the page is done loading, will display a throbber instead of page content until this is true. */
    loadCondition?: boolean
    /** Text to display by the throbber while loadCondition is false. */
    loadingText?: string
    /** Page description for <meta> tag. */
    metaDescription?: string | null
}