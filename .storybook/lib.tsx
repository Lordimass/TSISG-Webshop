import {NotificationsContext} from "../src/components/notification/lib.tsx";
import {ReactNode} from "react";
import {DEFAULT_COUNTRY, DEFAULT_CURRENCY, DEFAULT_LOCALE, LocaleContext} from "../src/localeHandler.ts";

export function DefaultContextWrapper({children}: {children: ReactNode}) {
    return (
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
    )
}