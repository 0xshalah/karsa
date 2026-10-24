// Integer formatting for i128 amounts. No floats anywhere.
const pow10 = (n) => 10n ** BigInt(n);

export const fmtInt = (n) => {
  const v = BigInt(n);
  const neg = v < 0n;
  const s = (neg ? -v : v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return (neg ? "-" : "") + s;
};

/** Fixed decimals, e.g. fmtDec(10000000n, 7) -> "1.0000000". */
export const fmtDec = (n, d) => {
  let v = BigInt(n);
  const neg = v < 0n;
  if (neg) v = -v;
  const base = pow10(d);
  return (neg ? "-" : "") + fmtInt(v / base) + (d > 0 ? "." + (v % base).toString().padStart(d, "0") : "");
};

/** Trimmed decimals, e.g. fmtUnits(5000000n, 7) -> "0.5". */
export const fmtUnits = (n, d, places = d) => {
  const full = fmtDec(n, d);
  const [w, f = ""] = full.split(".");
  const cut = f.slice(0, places).replace(/0+$/, "");
  return cut ? `${w}.${cut}` : w;
};

export const xlm = (stroops) => fmtDec(stroops, 7);

/** Percent num/den, half-up: 2 decimals when >= 0.01 %, else 6. */
export const fmtPct = (num, den) => {
  const n = BigInt(num);
  const d = BigInt(den);
  if (d === 0n) return "--";
  const SC = pow10(10);
  const v = (n * 100n * SC) / d;
  const pick = v >= SC / 100n ? 2 : 6;
  const drop = pow10(10 - pick);
  return fmtDec((v + drop / 2n) / drop, pick) + "%";
};

export const pctWidth = (n, d) => {
  if (BigInt(d) === 0n) return 0;
  const w = Number((BigInt(n) * 10000n) / BigInt(d)) / 100;
  return Math.max(0, Math.min(100, w));
};

export const shortId = (id) => (id ? `${id.slice(0, 6)}…${id.slice(-6)}` : "");
export const shortAddr = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");
