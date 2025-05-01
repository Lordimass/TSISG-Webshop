import { useEffect, useState } from "react"
import "../css/notification.css"

const info_icon: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png"

/*
This component allows displaying notifications to the user by dispatching events

EXAMPLE NOTIFICATION FUNCTION
function notify() {
    window.dispatchEvent(new CustomEvent("notification", {
        detail: {
            message: "This is a test notification!"
        }
    }))
}
*/

export default function Notifications() {
    function pushNotification(newNotif: React.JSX.Element): void {
        setNotificationStack(prevStack => {
            const updatedStack = [...prevStack, newNotif];
            setRenderedNotif(updatedStack[0])
            console.debug("Added notification, new stack ", updatedStack);
            return updatedStack
        })
    }
    
    function popNotification(): React.JSX.Element | null {
        const popped: React.JSX.Element = notificationStack[0]
        setNotificationStack( prevStack => {
            const updatedStack = prevStack.slice(1);
            if (updatedStack.length > 0) {
                setRenderedNotif(updatedStack[0])
            } else {
                setRenderedNotif(undefined)
            }
            console.debug("Removed notification, new stack " + updatedStack)
            return updatedStack;
        })
        
        return popped
    }
    
    function handleNotifEvent(event: Event) {
        const customEvent: CustomEvent = event as CustomEvent
        const message: string = customEvent.detail.message;
        const newNotif = <Notification message={message}/>
        pushNotification(newNotif)
        setRenderedNotif(newNotif)
    }

    function Notification({message}: {message: string}) {
        return (
            <div className="notification">
                <div className="notif-head">
                    <img src={info_icon}/>
                    <h2>Just to let you know...</h2> 
                    <div className="spacer"></div>
                    <div className="close-notif" onClick={popNotification}>x</div>
                </div>
                <p>{message}</p>
            </div>
        )
    }

    const [notificationStack, setNotificationStack] = useState<Array<React.JSX.Element>>(
        []
    );
    const [renderedNotif, setRenderedNotif] = useState<React.JSX.Element>(); 

    useEffect(() => {
        addEventListener("notification", handleNotifEvent)
    }, [])

    if (notificationStack.length > 0) {
        return (<>
            {renderedNotif}
        </>);
    } else {
        return (<></>);
    }

}



