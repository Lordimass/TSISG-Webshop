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

/**
 * Converts a string in `snake_case` to `Title Case`
 * @param str The string to convert, in `snake_case`
 * @returns The given string, but in `Title Case`.
 */
export function snakeToTitleCase(str: string): string {
        return str
            .replace(/_/g, ' ') // Replace `_` with ` `
            .replace(/\b\w/g, (char) => char.toUpperCase()) // Capitalise each word,
}