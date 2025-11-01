import { useEffect, useState } from "react";

import "./cookieBanner.css"

export function CookieBanner() {
  function acceptCookies() {
    // Update consent (Advanced mode)
    // Default values set in main.tsx
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer!.push(arguments);
    }
    window.gtag && window.gtag("consent", "update", {
      analytics_storage: "granted",
    });

    localStorage.setItem("consentModeAnswer", "accept")
    setExiting(true)
  };

  function declineCookies() {
    localStorage.setItem("consentModeAnswer", "decline")
    setExiting(true)
  };
  
  // Only show popup if it's not already been answered
  useEffect(() => {
    const consentModeAnswer = localStorage.getItem("consentModeAnswer")
    if (!consentModeAnswer) setVisible(true)
  }, [])

  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  if (!visible) return null;
  return (
    <div className="cookie-banner-container">
      <div className={`cookie-banner ${exiting ? "exit" : "enter"}`} onAnimationEnd={(e) => {
        if (e.animationName === "slideOutToTop") {setVisible(false); setExiting(false)}
      }}>
        <i className="fi fi-rr-cookie-alt cookie-icon"/>
        <span className="cookie-right">
          <p>We don't use any of those horrible cross-site cookies, but we do look at anonymous statistics to let us know how we're doing! Is that ok?</p>
          <span className="cookie-buttons">
            <button onClick={declineCookies}>Required Only</button>
            <button onClick={acceptCookies}>Accept</button>
          </span>
        </span>
      </div>
    </div>
  );
}
