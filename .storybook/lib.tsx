import {NotificationsContext} from "../src/components/notification/lib.tsx";
import {ReactNode} from "react";
import {DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_LOCALE, LocaleContext} from "../src/localeHandler.ts";
import { LoginContext } from "../src/app.tsx";

export function DefaultContextWrapper({children, permissions = []}: {
    children: ReactNode,
    /**
     * A list of mock permissions for the user.
     * Does not grant them permissions on Supabase so not everything will work by this method, but it allows certain
     * checks to be bypassed.
     */
    permissions?: string[]
}) {
    return (
        <LoginContext.Provider value={{
            loading: false,
            loggedIn: false,
            user: null,
            permissions: permissions,
        }}>
        <NotificationsContext.Provider value={{
            newNotif: {current: {id: Date.now(), message: "NullMessage"}},
            notify: (message: string) => console.log(`Notification: ${message}`)
        }}>
        <LocaleContext.Provider value={{
            locale: DEFAULT_LOCALE,
            currency: DEFAULT_CURRENCY,
            country: DEFAULT_COUNTRY,
        }}>
            {children}
        </LocaleContext.Provider>
        </NotificationsContext.Provider>
        </LoginContext.Provider>
    )
}