import {getRoute} from "../../lib/paths.ts";

export default function GlowRedirect() {
    const glowPath = window.location.pathname.slice(getRoute("GLOW_REDIRECT").length-1)
    const newUrl = "https://glowshops.com/"+glowPath
    window.location.href = newUrl;
    return <p>Redirecting you to <a href={newUrl}>glowshops.com</a>...</p>;
}