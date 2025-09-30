import { useContext, useEffect, useRef, useState } from "react";
import "./notification.css";
import { info_icon, reading_speed_cps } from "../../lib/consts";
import { Notif, NotificationsContext } from "./lib";

export default function Notifications() {
  const {newNotif} = useContext(NotificationsContext)
  const [internalQueue, setQueue] = useState<Notif[]>([]);
  const [visibleNotif, setVisibleNotif] = useState<Notif | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number>(null);

  // enqueue incoming notifs
  useEffect(() => {
    const handler = (e: any) => {
      const id = newNotif.current.id
      const message = newNotif.current.message
      const duration = newNotif.current.duration
      setQueue((q) => [...q, { id, message, duration }]);
    };
    window.addEventListener("notification", handler);
    return () => window.removeEventListener("notification", handler);
  }, []);

  // when nothing is showing, dequeue the next
  useEffect(() => {
    if (!visibleNotif && internalQueue.length > 0) {
      const [next, ...rest] = internalQueue;
      setQueue(rest);
      setVisibleNotif(next);
    }
  }, [internalQueue, visibleNotif]);

  // whenever a new visibleNotif appears, trigger slide‑in then auto‑dismiss
  useEffect(() => {
    if (!visibleNotif) return;
    // ensure it starts hidden
    setIsVisible(false);

    // next tick: add the "visible" class so CSS transition runs
    const id1 = window.setTimeout(() => setIsVisible(true), 20);

    // schedule slide‑out after set duration, calculated time to read, or 5s minimum
    if (visibleNotif.duration) {
      timeoutRef.current = window.setTimeout(() => setIsVisible(false), (Math.min(visibleNotif.duration*1000+20, 5000)));
    } else {
      timeoutRef.current = window.setTimeout(() => setIsVisible(false), Math.min(
        visibleNotif.message.length / reading_speed_cps * 1000 + 20, 5000
      ));
    }

    return () => {
      clearTimeout(id1);
      clearTimeout(timeoutRef.current!);
    };
  }, [visibleNotif]);

  // 4) when slide‑out completes, clear visibleNotif so next can mount
  useEffect(() => {
    if (visibleNotif && !isVisible) {
      const id2 = window.setTimeout(() => setVisibleNotif(null), 400);
      return () => clearTimeout(id2);
    }
  }, [isVisible, visibleNotif]);

  function pop() {
    clearTimeout(timeoutRef.current!);
    setIsVisible(false);
  }

  if (!visibleNotif) return null;

  return (
    <div className={`notification ${isVisible ? "visible" : ""}`}>
      <div className="notif-head">
        <img src={info_icon} alt="info" />
        <h2>Just to let you know…</h2>
        <div className="spacer" />
        <div className="close-notif" onClick={pop}>x</div>
      </div>
      <p>{visibleNotif.message}</p>
    </div>
  );
}
