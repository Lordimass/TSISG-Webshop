import {createContext, ReactNode, RefObject} from "react";

export type Notif = { id: number; message: string; duration?: number };

export const NotificationsContext = createContext<{
    newNotif: RefObject<Notif>,
    notify: (message: string) => void,
    tooltips: ReactNode[]
    setTooltips: (tooltips: ReactNode[]) => void
}>({
    newNotif: {current: {id: Date.now(), message: "NullMessage"}},
    notify: (message: string) => {
        console.error(`Notify method does not exist, failed to notify with message: ${message}`)
    },
    tooltips: [],
    setTooltips: (_tooltips: ReactNode[]) => {
        console.error(`setTooltips method does not exist, failed to set tooltips.`)
    }
})