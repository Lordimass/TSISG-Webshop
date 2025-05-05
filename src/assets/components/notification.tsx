import { useEffect, useRef, useState } from "react";
import "../css/notification.css";

const info_icon =
  "https://iumlpfiybqlkwoscrjzt.supabase.co/storage/v1/object/public/other-assets//information.png";

type Notif = { id: number; message: string };

export default function Notifications() {
  const [queue, setQueue] = useState<Notif[]>([]);
  const [visibleNotif, setVisibleNotif] = useState<Notif | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<number>(null);

  // 1) enqueue incoming events
  useEffect(() => {
    const handler = (e: any) => {
      const msg = e.detail?.message;
      if (typeof msg === "string") {
        setQueue((q) => [...q, { id: Date.now(), message: msg }]);
      }
    };
    window.addEventListener("notification", handler);
    return () => window.removeEventListener("notification", handler);
  }, []);

  // 2) when nothing is showing, dequeue the next
  useEffect(() => {
    if (!visibleNotif && queue.length > 0) {
      const [next, ...rest] = queue;
      setQueue(rest);
      setVisibleNotif(next);
    }
  }, [queue, visibleNotif]);

  // 3) whenever a new visibleNotif appears, trigger slide‑in then auto‑dismiss
  useEffect(() => {
    if (!visibleNotif) return;

    // ensure it starts hidden
    setIsVisible(false);

    // next tick: add the "visible" class so CSS transition runs
    const id1 = window.setTimeout(() => setIsVisible(true), 20);

    // schedule slide‑out after 5s
    timeoutRef.current = window.setTimeout(() => setIsVisible(false), 5020);

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

export function notify(message: string) {
  window.dispatchEvent(new CustomEvent("notification", { detail: { message } }));
}
