import { useEffect, useRef, useState } from "react"
import "../css/notification.css"

const info_icon: string = "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png"

/*
This component allows displaying notifications to the user by dispatching events
*/

type Notif = { id: number; message: string };

export default function Notifications() {
    const [stack, setStack] = useState<Notif[]>([]);
    const timeoutRef = useRef<number | null>(null);
  
    // Listen for new notifications
    useEffect(() => {
      function handler(e: any) {
        const newNotif = { id: Date.now(), message: e.detail.message };
  
        // clear any previous timeout (so it won’t close the next one)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
  
        // push the new notification
        setStack((s) => [...s, newNotif]);
  
        // schedule its auto‑close
        timeoutRef.current = window.setTimeout(() => {
          pop();
        }, 5000);
      }
  
      window.addEventListener("notification", handler);
      return () => window.removeEventListener("notification", handler);
    }, []);
  
    function pop() {
      console.log("Popping notification");
      // clear the timeout so it won’t fire again
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setStack((s) => s.slice(1));
    }
  
    if (stack.length === 0) return null;
  
    const { message } = stack[0];
    return (
      <div className="notification">
        <div className="notif-head">
          <img src={info_icon} alt="info" />
          <h2>Just to let you know…</h2>
          <div className="spacer" />
          <div className="close-notif" onClick={pop}>x</div>
        </div>
        <p>{message}</p>
      </div>
    );
  }

export function notify(message: string) {
    window.dispatchEvent(new CustomEvent("notification", {
        detail: {
            message: message
        }
    }))
}



