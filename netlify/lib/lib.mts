/**
 * Formats a number of bytes as a readable byte string
 * @param bytes Number of bytes
 * @returns Readable byte string
 */
export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }
  return `${bytes.toFixed(2)} ${units[i]}`;
}

/**
 * Checks if two objects contain the same data
 * @param obj1 First object
 * @param obj2 Second object
 * @returns True if objects are equal, false otherwise
 */
export function checkObjectsEqual(obj1: any, obj2: any) {
    const obj1Length = Object.keys(obj1).length;
    const obj2Length = Object.keys(obj2).length;

    if(obj1Length === obj2Length) {
        return Object.keys(obj1).every(
            key => obj2.hasOwnProperty(key)
                && obj2[key] === obj1[key]);
    }
    return false;
}

/**
 * Sends a GA4 event.
 * @param payload - The event payload.
 * @param event - The event name.
 * @param debug - Whether to enable debug mode. Enabling this prevents events from
 * being ingested, meaning they won't show up in DebugView.
 */
export async function sendGA4Event(payload: any, debug=false) {
    const response = await fetch(`https://region1.google-analytics.com/${debug ? "debug/" : ""}mp/collect?api_secret=${process.env.GA4_MEASUREMENT_PROTOCOL_SECRET}&measurement_id=${process.env.VITE_GA4_MEASUREMENT_ID}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    })
    if (!response.ok) {
        console.error("Failed to send GA4 event: ", response.statusText)
    } else {
        console.log("Successfully sent GA4 event", response.status, response.statusText)
        if (debug) console.log("GA4 Debug Response:", await response.json())
    }
}