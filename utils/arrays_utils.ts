/* ---------- Utility Functions ---------- */

/**
 * Compare two arrays of objects (order-insensitive, key-insensitive).
 */
export function compareArrays<T extends Record<string, unknown>>(
  array1: T[],
  array2: T[]
): boolean {
  if (array1.length !== array2.length) return false;

  const serialize = (obj: T): string =>
    JSON.stringify(
      Object.keys(obj)
        .sort()
        .map((key) => [key, obj[key]])
    );

  const set1 = new Set(array1.map(serialize));
  return array2.every((obj) => set1.has(serialize(obj)));
}

/**
 * Filter array of objects by `name` property and return the matching `value`s.
 */
export function filterArray<T extends { name: string; value: unknown }>(
  array: T[],
  property: string
): T["value"][] {
  return array
    .filter((item) => item.name === property)
    .map((item) => item.value);
}

/**
 * Remove duplicates from an array (primitive values only).
 */
export function removeDuplicates<T>(array: T[]): T[] {
  return [...new Set(array)];
}

/**
 * Randomize/shuffle an array (non-mutating).
 */
export function randomize<T>(array: T[]): T[] {
  return [...array].sort(() => Math.random() - 0.5);
}