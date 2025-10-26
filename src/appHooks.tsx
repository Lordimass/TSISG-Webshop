import { useEffect, useRef, useState } from "react";
import { User, UserResponse } from "@supabase/supabase-js";
import { supabase } from "./lib/supabaseRPC";
import { Notif } from "./components/notification/lib";
import { useFetchFromNetlifyFunction } from "./lib/netlifyFunctions";
import { refreshBasket } from "./lib/lib";
import ReactGA from "react-ga4";

/**
 * Keeps track of the current login state of the user
 * @returns `loggedIn`: Whether the user is logged in to an account
 * @returns `
 */
export function useLogin() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState([])
  const [loading, setLoading] = useState(true)

  /**
   * Update the login context with up to date
   * information from Supabase Auth servers.
   */
  async function updateLoginContext() {
    const resp: UserResponse = await supabase.auth.getUser();
    // AuthSessionMissingError just means the user is not logged in. This is not a problem here.
    if (resp.error && resp.error.name !== "AuthSessionMissingError") throw new Error(resp.error.name);
    
    const user = resp.data.user
    setUser(user)
    setLoggedIn(!!user)
    if (user) {
      const permissions = user.app_metadata.permissions
      setPermissions(permissions ?? [])
    }
    setLoading(false)
  }

  // If auth state changes, reauthorise user.
  useEffect(() => {
    const {data: {subscription}} = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          updateLoginContext()
      }})
    // Cleanup function to remove listener when component unmounts to prevent recursive checks
    return () => {subscription.unsubscribe();};
  }, [])

  // Authorise user on first load
  useEffect(() => {updateLoginContext()}, [])

  return { loggedIn, user, permissions, loading };
}

/**
 * Sets up `notify` function.
 * @returns 
 */
export function useNotifs() {
  // Set up notification queue
  let newNotif = useRef<Notif>({id: Date.now(), message: "NullMessage"})
  function notify(msg: string, duration?: number) {
    newNotif.current = {id: Date.now(), message: msg, duration}
    window.dispatchEvent(new CustomEvent("notification"))
  }
  return {newNotif, notify}
}

/**
 * Fetches the Site Settings from the Supabase site_settings table.
 * Also updates whether the Kill Switch should be enabled, and
 * sends any configured session notifications.
 * @param notify The function to use to send notifications
 * @returns The Site Settings
 */
export function useSiteSettings(notify: (msg: string, duration?: number) => void) {
  // Fetching Site Settings
  let siteSettings = useFetchFromNetlifyFunction("getSiteSettings").data ?? {};

  // Notify if kill switch enabled, ONLY on start of session
  // Also notify session_notif if in time range
  useEffect(() => {
    const killSwitchNotified = sessionStorage.getItem('killSwitchNotified')
    if (
      siteSettings.kill_switch  
      && siteSettings.kill_switch.enabled 
      && !killSwitchNotified
    ) {
      sessionStorage.setItem("killSwitchNotified", "true")
      console.log("== KILL SWITCH ENABLED ==")
      notify(siteSettings.kill_switch.message)
    }
    const sessionNotifNotified = sessionStorage.getItem("sessionNotifNotified")
    const sessionNotif = siteSettings.session_notif
    const now = new Date()
    if (
      !sessionNotifNotified
      && sessionNotif
      && +(new Date(sessionNotif.endTime)) > +now // Coerce dates to numbers
      && +(new Date(sessionNotif.startTime)) < +now
    ) {
      sessionStorage.setItem("sessionNotifNotified", "true")
      notify(sessionNotif.message, sessionNotif.duration ?? undefined)
    }
  }, [siteSettings])

  return siteSettings
}

/**
 * Updates the contents of the localStorage basket if it's been
 * longer than 10 minutes since it was last refreshed
 */
export function useConditionalBasketUpdate() {
  useEffect(() => {
    // Not necessary on checkout page since a refresh
    // is done serverside as part of checkout 
    // initialisation anyways
    if (window.location.pathname == "/checkout") return

    const basketString = localStorage.getItem("basket")
    if (!basketString) return
    const basketObj = JSON.parse(basketString)
    if (!basketObj.lastUpdated) refreshBasket()
    const timeSinceUpdate = (new Date().getTime()) - (new Date(basketObj.lastUpdated).getTime())
    if (timeSinceUpdate > 600000) refreshBasket()
  }, [])
}

/**
 * TO BE RUN IN main.tsx
 * 
 * Initialises GA4 with default denied settings until cookies
 * are accepted.
 * 
 * GA4 must be initialised before consent for Advanced mode,
 * which sends cookie-less pings to track analytics without
 * association with the user.
 */
export function initGA4() {
  const dev = import.meta.env.VITE_ENVIRONMENT === "DEVELOPMENT"
  if (dev) console.log("In a development environment");

  const consent = (localStorage.getItem("consentModeAnswer") === "accept") ? "granted" : "denied";

  // Consent Mode V2 defaults (deny until user chooses)
  gtag("consent", "default", {
    // deny optional cookies for now.
    ad_storage: "denied",
    analytics_storage: consent,
    ad_user_data: "denied",
    ad_personalization: "denied",
    // allow essential cookies.
    functionality_storage: 'granted',
    security_storage: 'granted'        
  });

  ReactGA.initialize(import.meta.env.VITE_GA4_MEASUREMENT_ID);
  gtag("config", import.meta.env.VITE_GA4_MEASUREMENT_ID, {"debug_mode": dev})

  // Load GA4 library
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${
    import.meta.env.VITE_GA4_MEASUREMENT_ID
  }`;
  document.head.appendChild(script);
}

(window).dataLayer = (window).dataLayer || [];
export const gtag = function (...args: unknown[]) { (window).dataLayer?.push(arguments); };
