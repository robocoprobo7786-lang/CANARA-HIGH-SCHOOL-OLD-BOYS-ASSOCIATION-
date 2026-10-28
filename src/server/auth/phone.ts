/**
 * Normalises an Indian mobile number into a clean 10-digit string.
 * Strips out "+91", leading zeros, dashes, and whitespace.
 * Returns null if the resulting number is not a valid 10-digit Indian mobile number.
 */
export function normalizeMobileNumber(input: string): string | null {
  if (!input) return null;

  // Remove whitespace, dashes, parentheses, dots
  let cleaned = input.replace(/[\s\-\(\)\.]/g, "");

  // Strip international prefixes like +91, 0091, 91 (if length > 10)
  if (cleaned.startsWith("+91")) {
    cleaned = cleaned.slice(3);
  } else if (cleaned.startsWith("0091")) {
    cleaned = cleaned.slice(4);
  } else if (cleaned.startsWith("0") && cleaned.length === 11) {
    // Leading zero trunk prefix: 09876543210 -> 9876543210
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith("91") && cleaned.length === 12) {
    cleaned = cleaned.slice(2);
  }

  // Validate that it consists of exactly 10 digits and starts with 5, 6, 7, 8, or 9
  if (/^[5-9]\d{9}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

