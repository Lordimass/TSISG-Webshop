import { JSX } from "react";
import Header from "../header-footer/header";
import Footer from "../header-footer/footer";
import { LoadingScreen } from "../throbber/throbber";

/**
 * Default page format for the site.
 * @param id The ID of the div holding the page content
 * @param canonical Canonical URL for the page, will be embedded in the page header.
 * @param noindex Whether to tell Googlebot not to index this page.
 * @param title The title of the page, written on the tab next to the favicon.
 * @param loadCondition Whether the page is done loading, will display a throbber instead of page content until this is true.
 * @param loadingText Text to display by the throbber while loadCondition is false.
 * @param metaDescription Page description for <meta> tag.
 */
export default function Page({
    children, id, canonical, title, loadingText, metaDescription,
    loadCondition = true, 
    noindex = false
} : {
    children?: JSX.Element[] | JSX.Element
    id?: string
    canonical?: string
    noindex?: boolean
    title?: string
    loadCondition?: boolean
    loadingText?: string
    metaDescription?: string
}) {
    return (<><Header/><div className="content" id={id}>
        {title ? <title>{title}</title> : null}
        {canonical ? <link rel='canonical' href={canonical}/> : null}
        {noindex ? <meta name="robots" content="noindex"/> : null}
        {metaDescription ? <meta name="description" content={metaDescription}/> : null}

        {!loadCondition ? <LoadingScreen text={loadingText}/> : null} 
        {children}
        </div><Footer/></>)
}