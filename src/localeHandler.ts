import {createContext} from "react";

const LocaleContext = createContext<{
    locale: string;
}>({locale: 'en_GB'})

/**
 * @return The user's locale string.
 */
async function useLocale() {
    const urlParams = new URLSearchParams(window.location.search);
    const locale = urlParams.get('locale');
    if (!locale) {
        // Check user location/default locale and update query string on URL to match
    } else {
        window.history.replaceState(null, '', `?locale=${locale}`);
    }
}