import ReactGA from "react-ga4"

/**
 * Get the Google Analytics client ID from the cookie.
 * @returns The GA client ID or null if not found.
 */
export function getGAClientId(): string | null {
    // Get the _ga cookie value.
    const cookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('_ga='));
    if (!cookie) return null;
    const value = cookie.split('=')[1];

    // Cookie looks like GA1.2.1234567890.987654321
    // The last two parts are the client ID
    // Decode and extract the client ID
    const parts = value.split('.');
    if (parts.length >= 4) {
        return `${parts[2]}.${parts[3]}`;
    }
    return null;
}

export async function getGAClientIdGtag(): Promise<string | null> {
    return new Promise((resolve) => {
        ReactGA.gtag("get", import.meta.env.VITE_GA4_MEASUREMENT_ID, "client_id", (id: any) => {
            resolve(id);
        });
    });
}

/**
 * Get the Google Analytics session ID.
 * @returns The GA session ID or null if not found.
 */
export async function getGASessionId(): Promise<string | null> {
    return new Promise((resolve) => {
        ReactGA.gtag("get", import.meta.env.VITE_GA4_MEASUREMENT_ID, "session_id", (id: any) => {
            resolve(id);
        });
    });
}