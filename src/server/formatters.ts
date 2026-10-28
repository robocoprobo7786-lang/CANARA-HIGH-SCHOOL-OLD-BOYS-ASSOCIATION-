/**
 * Formats a numeric member sequence into the permanent membership ID.
 * Example: 1 -> "CHSOBA-0001"
 * FRS §5.4: Sequential format CHSOBA-0001, CHSOBA-0002, etc. Permanent and never reassigned.
 */
export function formatMembershipId(sequence: number): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(`Membership ID sequence must be a positive integer, got ${sequence}`);
  }
  return `CHSOBA-${String(sequence).padStart(4, "0")}`;
}

/**
 * Returns the current calendar year in Indian Standard Time (Asia/Kolkata).
 * FRS §8.1: Independent sequence for each calendar year (January through December).
 * Uses IST to ensure midnight boundary aligns with the association's local time.
 */
export function getIndiaCalendarYear(date: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
  }).formatToParts(date);

  const yearPart = parts.find((p) => p.type === "year");
  if (!yearPart) {
    throw new Error("Failed to format calendar year for Asia/Kolkata");
  }
  return parseInt(yearPart.value, 10);
}

/**
 * Formats a receipt number according to FRS §8.1.
 * Membership: LM/YYYY/0001
 * Endowment:  END/YYYY/0001
 * 
 * @param type - "membership" or "endowment"
 * @param year - 4-digit calendar year
 * @param sequence - 1-based sequential number for that calendar year
 */
export function formatReceiptNumber(
  type: "membership" | "endowment",
  year: number,
  sequence: number
): string {
  if (!Number.isInteger(sequence) || sequence <= 0) {
    throw new Error(`Receipt sequence must be a positive integer, got ${sequence}`);
  }
  const prefix = type === "membership" ? "LM" : "END";
  return `${prefix}/${year}/${String(sequence).padStart(4, "0")}`;
}

