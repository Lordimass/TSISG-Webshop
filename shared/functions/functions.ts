/**
 * Formats a number of bytes as a human-readable string
 * @param bytes Number of bytes
 * @returns Human-readable string
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