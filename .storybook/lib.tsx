import {NotificationsContext} from "../src/components/notification/lib.tsx";
import {ReactNode, useState} from "react";
import {DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_LOCALE, LocaleContext} from "../src/localeHandler.ts";
import {LoginContext, SiteSettingsContext} from "../src/app.tsx";
import {useSiteSettings} from "../src/appHooks.tsx";
import {SiteSettings} from "@shared/types/types.ts";

export function DefaultContextWrapper({children, permissions = [], kill_switch}: {
    children: ReactNode,
    /**
     * A list of mock permissions for the user.
     * Does not grant them permissions on Supabase so not everything will work by this method, but it allows certain
     * checks to be bypassed.
     */
    permissions?: string[]
    /**
     * Override for the current value of kill_switch in the site settings.
     */
    kill_switch?: SiteSettings["kill_switch"]
}) {
    const notify = (msg: string) => {console.log(`Notification: ${msg}`)}
    const siteSettings = {...useSiteSettings(notify), kill_switch}
    const [tooltips, setTooltips] = useState<ReactNode[]>([])

    return (
        <LoginContext.Provider value={{
            loading: false,
            loggedIn: false,
            user: null,
            permissions: permissions,
        }}>
        <SiteSettingsContext.Provider value={siteSettings}>
        <NotificationsContext.Provider value={{
            newNotif: {current: {id: Date.now(), message: "NullMessage"}}, notify, tooltips, setTooltips
        }}>
        <LocaleContext.Provider value={{
            locale: DEFAULT_LOCALE,
            currency: DEFAULT_CURRENCY,
            country: DEFAULT_COUNTRY,
        }}>
            {children}
        </LocaleContext.Provider>
        </NotificationsContext.Provider>
        </SiteSettingsContext.Provider>
        </LoginContext.Provider>
    )
}