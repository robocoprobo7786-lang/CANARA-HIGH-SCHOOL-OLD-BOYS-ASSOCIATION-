/**
 * Money utilities:
 * Enforces Non-negotiable Rule #3:
 * "Money is numeric(12,2) in the database and handled as strings or integers of paise in code, never JS floats."
 */

/**
 * Converts a standard decimal string (e.g. "1000.00", "500", "12.50") into integer paise (cents).
 * Avoids any floating-point multiplication (like `parseFloat(x) * 100`).
 */
export function rupeesToPaise(rupees: string): bigint {
  const trimmed = rupees.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    throw new Error(`Invalid rupee amount string: "${rupees}". Expected format "1000" or "1000.50".`);
  }

  const isNegative = trimmed.startsWith("-");
  const clean = isNegative ? trimmed.slice(1) : trimmed;
  const [whole, decimal = ""] = clean.split(".");

  const paddedDecimal = decimal.padEnd(2, "0").slice(0, 2);
  const paiseString = `${whole}${paddedDecimal}`;
  const paise = BigInt(paiseString);

  return isNegative ? -paise : paise;
}

/**
 * Converts integer paise into a 2-decimal formatted rupee string (e.g. 100000n -> "1000.00").
 */
export function paiseToRupees(paise: bigint | number): string {
  const bPaise = BigInt(paise);
  const isNegative = bPaise < BigInt(0);
  const abs = isNegative ? -bPaise : bPaise;

  const whole = abs / BigInt(100);
  const remainder = abs % BigInt(100);
  const remainderStr = remainder.toString().padStart(2, "0");

  return `${isNegative ? "-" : ""}${whole.toString()}.${remainderStr}`;
}

/**
 * Formats a rupee amount with currency symbol for display (e.g. "₹1,000.00").
 */
export function formatRupeesDisplay(rupees: string | bigint | number): string {
  const decimalStr = typeof rupees === "string" ? paiseToRupees(rupeesToPaise(rupees)) : paiseToRupees(rupees);
  const [whole, decimal] = decimalStr.split(".");
  // Format whole portion in Indian numbering format: e.g. 1,00,000
  const isNegative = whole.startsWith("-");
  const absWhole = isNegative ? whole.slice(1) : whole;

  let lastThree = absWhole.slice(-3);
  const otherNumbers = absWhole.slice(0, -3);
  if (otherNumbers !== "") {
    lastThree = "," + lastThree;
  }
  const formattedWhole = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;

  return `${isNegative ? "-" : ""}₹${formattedWhole}.${decimal}`;
}

/**
 * Adds two decimal rupee strings without floating-point math.
 */
export function addRupees(a: string, b: string): string {
  return paiseToRupees(rupeesToPaise(a) + rupeesToPaise(b));
}

/**
 * Subtracts two decimal rupee strings (a - b) without floating-point math.
 */
export function subtractRupees(a: string, b: string): string {
  return paiseToRupees(rupeesToPaise(a) - rupeesToPaise(b));
}

/**
 * Compares two decimal rupee strings.
 * Returns -1 if a < b, 0 if a == b, 1 if a > b.
 */
export function compareRupees(a: string, b: string): number {
  const diff = rupeesToPaise(a) - rupeesToPaise(b);
  if (diff < BigInt(0)) return -1;
  if (diff > BigInt(0)) return 1;
  return 0;
}

