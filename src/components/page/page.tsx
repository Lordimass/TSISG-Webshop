import Header from "../header-footer/header";
import Footer from "../header-footer/footer";
import { LoadingScreen } from "../throbber/throbber";
import { PageParams } from "./lib";

/** Default page format for the site. */
export default function Page({
    children, id, canonical, title, loadingText, metaDescription,
    loadCondition = true, 
    noindex = false
} : PageParams) {
    return (<><Header/><div className="content" id={id}>
        {title ? <title>{title}</title> : null}
        {canonical ? <link rel='canonical' href={canonical}/> : null}
        {noindex ? <meta name="robots" content="noindex"/> : null}
        {metaDescription ? <meta name="description" content={metaDescription}/> : null}

        {!loadCondition ? <LoadingScreen text={loadingText}/> : null} 
        {children}
        </div><Footer/></>)
}