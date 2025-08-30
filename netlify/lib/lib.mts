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
export function checkObjectsEqual(obj1: Object, obj2: Object) {
    const obj1Length = Object.keys(obj1).length;
    const obj2Length = Object.keys(obj2).length;

    if(obj1Length === obj2Length) {
        return Object.keys(obj1).every(
            key => obj2.hasOwnProperty(key)
                && obj2[key] === obj1[key]);
    }
    return false;
}