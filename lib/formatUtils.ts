
/**
 * Safely format a number to a fixed number of decimal places.
 * Returns a fallback string if the value is null, undefined, or NaN.
 */
export function safeToFixed(value: number | null | undefined, digits: number = 2, fallback: string = '-'): string {
  if (value === null || value === undefined || isNaN(value)) {
    return fallback;
  }
  return value.toFixed(digits);
}
