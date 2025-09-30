import { useContext, useEffect, useRef, useState } from "react";
import "./notification.css";
import { reading_speed_cps } from "../../lib/consts";
import { Notif, NotificationsContext } from "./lib";

export default function Notifications() {
  const {newNotif} = useContext(NotificationsContext)
  const [queue, setQueue] = useState<Notif[]>([]);
  const [visibleNotif, setVisibleNotif] = useState<Notif | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeout = useRef<number>(null);

  // enqueue incoming notifs
  useEffect(() => {
    function handler() {
      const id = newNotif.current.id
      const message = newNotif.current.message
      const duration = newNotif.current.duration
      setQueue([...queue, { id, message, duration }]);
    };

    window.addEventListener("notification", handler);
    return () => window.removeEventListener("notification", handler);
  }, []);

  // when nothing is showing, dequeue the next
  useEffect(() => {
    if (!visibleNotif && queue.length > 0) {
      const [head, ...tail] = queue;
      setQueue(tail);
      setVisibleNotif(head);
    }
  }, [queue, visibleNotif]);

  // whenever a new visibleNotif appears, trigger slide‑in then auto‑dismiss
  useEffect(() => {
    if (!visibleNotif) return;
    // ensure it starts hidden
    setIsVisible(false);

    // Add the "visible" class, running the css transition
    setIsVisible(true)

    // schedule slide‑out after set duration, calculated time to read, or 5s minimum
    if (visibleNotif.duration) {
      timeout.current = window.setTimeout(
        () => setIsVisible(false), 
        Math.max(visibleNotif.duration*1000+20, 1000)
      );
    } else {
      timeout.current = window.setTimeout(
        () => setIsVisible(false), 
        Math.max(visibleNotif.message.length / reading_speed_cps * 1000 + 20, 5000)
      );
    }

    return () => {
      clearTimeout(timeout.current!);
    };
  }, [visibleNotif]);

  // when slide‑out completes, clear visibleNotif so next can mount
  useEffect(() => {
    if (visibleNotif && !isVisible) {
      const id2 = window.setTimeout(() => setVisibleNotif(null), 400);
      return () => clearTimeout(id2);
    }
  }, [isVisible, visibleNotif]);

  function pop() {
    clearTimeout(timeout.current!);
    setIsVisible(false);
  }

  if (!visibleNotif) return null;

  return (
    <div className={`notification ${isVisible ? "visible" : "exiting"}`}>
      <div className="notif-head">
        <i className="fi fi-rr-info info-icon"/>
        <h2>Just to let you know...</h2>
        <div className="spacer" />
        <div className="close-notif" onClick={pop}>x</div>
      </div>
      <p>{visibleNotif.message}</p>
    </div>
  );
}
