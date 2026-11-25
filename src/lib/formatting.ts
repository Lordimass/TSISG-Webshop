/**
 * Converts a string in `snake_case` to `Title Case`
 * @param str The string to convert, in `snake_case`
 * @returns The given string, but in `Title Case`.
 */
export function snakeToTitleCase(str: string): string {
  return str
    .replace(/_/g, " ") // Replace `_` with ` `
    .replace(/\b\w/g, (char) => char.toUpperCase()); // Capitalise each word,
}
