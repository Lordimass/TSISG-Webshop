import {NotificationsContext} from "../../components/notification/lib.tsx";
import {useNotifs} from "../../appHooks.tsx";
import Page from "../../components/page/page.tsx";
import {FallbackProps} from "react-error-boundary"
import {ReactNode, useEffect, useState} from "react";

export default function Fallback(props: FallbackProps) {
    const {newNotif, notify} = useNotifs();
    useEffect(() => {
        notify(`Something went wrong! ${props.error.message} [${props.error.name}]`, 1000)
    }, [])
    const [tooltips, setTooltips] = useState<ReactNode[]>([])
    return (<NotificationsContext.Provider value={{newNotif, notify, tooltips, setTooltips}}>
        <Page noindex>
            <p>Fallback page!</p>
        </Page>
    </NotificationsContext.Provider>)
}