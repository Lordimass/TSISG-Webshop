import { useContext } from "react";
import { PageParams } from "./lib";
import { LoginContext } from "../../app";
import Page from "./page";
import { LoadingScreen } from "../throbber/throbber";

/**
 * A page which requires special permissions to access.
 * @param 
 * @param id The ID of the div holding the page content
 * @param canonical Canonical URL for the page, will be embedded in the page header.
 * @param noindex Whether to tell Googlebot not to index this page. Defaults to true.
 * @param title The title of the page, written on the tab next to the favicon.
 * @param loadCondition Whether the page is done loading, will display a throbber instead of page content until this is true.
 * @param loadingText Text to display by the throbber while loadCondition is false.
 * @param metaDescription Page description for <meta> tag.
 */
export default function AuthenticatedPage({
    requiredPermission, children, id, canonical, title, loadingText, metaDescription,
    loadCondition = true, 
    noindex = true
} : PageParams & {requiredPermission: string}) {
    const loginContext = useContext(LoginContext)
    const content = loginContext.loading
        ? <LoadingScreen text="Checking if you have permission to access this content"/>
        : loginContext.permissions.includes(requiredPermission)
            ? children
            : <NotLoggedIn/>

    return (<Page
        id={id} 
        canonical={canonical} 
        title={title} 
        metaDescription={metaDescription} 
        noindex={noindex}
        loadCondition={loadCondition || loginContext.loading}
        loadingText={loadingText}
    >
        {content}
    </Page>)
}

function NotLoggedIn() {
    return (
        <div className="login-box">
            <p style={{textAlign: "center"}}>
                You're not logged in to an account with access to this page.
                If you believe this is a mistake, first, <a href="/login">check that you're logged in</a>.
                Failing this, contact support and we can help you out!
            </p>
        </div>
    )
}