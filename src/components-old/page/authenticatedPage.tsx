import React, {useContext, useRef} from "react";
import {PageParams} from "./lib";
import {LoginContext} from "../../app";
import Page from "./page";
import {LoadingScreen} from "../throbber/throbber";
import {getPath} from "../../lib/paths.ts";

/** A page which requires special permissions to access. */
export default function AuthenticatedPage({
                                              requiredPermission,
                                              children,
                                              id,
                                              canonical,
                                              title,
                                              loadingText,
                                              metaDescription,
                                              loadCondition = true,
                                              noindex = true
                                          }: PageParams & {
    /** The permission required to access the page */
    requiredPermission: string
}) {
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
    function handleLinkClicked(e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) {
        e.preventDefault();
        sessionStorage.setItem("postLoginRedirect", window.location.href);
        window.location.assign("/login");
    }

    const linkRef = useRef<HTMLAnchorElement>(null);

    return (
        <div className="login-box">
            <p style={{textAlign: "center"}}>
                You're not logged in to an account with access to this page.
                If you believe this is a mistake, first, <a
                onClick={handleLinkClicked}
                href={getPath("LOGIN")}
                ref={linkRef}
            >check that you're logged in</a>.
                Failing this, contact support and we can help you out!
            </p>
        </div>
    )
}