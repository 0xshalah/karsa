const pow10 = (n) => 10n ** BigInt(n);

/** Parse a human decimal string ("1.5") into integer units, or null when invalid. */
export const parseUnits = (str, decimals) => {
  const v = String(str ?? "").trim().replace(/,/g, "");
  if (v === "" || v === ".") return null;
  if (!new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`).test(v)) return null;
  const [w, f = ""] = v.split(".");
  return BigInt(w || "0") * pow10(decimals) + BigInt(f.padEnd(decimals, "0") || "0");
};

/** Integer units back to an input-friendly decimal string. */
export const toInput = (raw, decimals) => {
  const v = BigInt(raw ?? 0);
  const base = pow10(decimals);
  const frac = (v % base).toString().padStart(decimals, "0").replace(/0+$/, "");
  return frac ? `${v / base}.${frac}` : `${v / base}`;
};
