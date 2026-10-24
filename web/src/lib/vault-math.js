// Karsa Vault conversion math, mirroring PRD §3.5. BigInt only, no floats.
//   effective_assets = total_assets + v_assets          (v_assets = 1,000,000,000 stroops = 100 XLM)
//   effective_shares = total_supply + v_shares          (v_shares = v_assets * 10^offset)
// floor: convert_to_shares, convert_to_assets, preview_deposit, preview_redeem
// ceil:  preview_mint, preview_withdraw

export const V_ASSETS = 1_000_000_000n;
export const I128_MAX = (1n << 127n) - 1n;

const big = (v) => BigInt(v ?? 0);
const floorDiv = (a, b) => a / b;
const ceilDiv = (a, b) => (a + b - 1n) / b;

export const anchor = (offset = 3) => {
  const vA = V_ASSETS;
  const vS = V_ASSETS * 10n ** BigInt(offset);
  return { vA, vS };
};

const eff = (totalAssets, totalSupply, offset) => {
  const { vA, vS } = anchor(offset);
  return { A: big(totalAssets) + vA, S: big(totalSupply) + vS };
};

const guard = (x) => {
  const v = big(x);
  if (v < 0n) throw new RangeError("negative amount");
  if (v > I128_MAX) throw new RangeError("amount exceeds i128::MAX");
  return v;
};

export const convertToShares = (assets, ta, ts, offset = 3) => {
  const { A, S } = eff(ta, ts, offset);
  return floorDiv(guard(assets) * S, A);
};
export const convertToAssets = (shares, ta, ts, offset = 3) => {
  const { A, S } = eff(ta, ts, offset);
  return floorDiv(guard(shares) * A, S);
};
/** Shares minted for `assets` (floor). */
export const previewDeposit = convertToShares;
/** Assets pulled to mint exactly `shares` (ceil). */
export const previewMint = (shares, ta, ts, offset = 3) => {
  const { A, S } = eff(ta, ts, offset);
  return ceilDiv(guard(shares) * A, S);
};
/** Shares burned to withdraw exactly `assets` (ceil). */
export const previewWithdraw = (assets, ta, ts, offset = 3) => {
  const { A, S } = eff(ta, ts, offset);
  return ceilDiv(guard(assets) * S, A);
};
/** Assets paid for redeeming `shares` (floor). */
export const previewRedeem = convertToAssets;

export const maxWithdraw = (ownerShares, ta, ts, offset = 3) => convertToAssets(ownerShares, ta, ts, offset);
export const maxRedeem = (ownerShares) => big(ownerShares);

/**
 * XLM per KRS with 7 decimals, as an integer:
 *   price = ((ta + v_assets) / 1e7) / ((ts + v_shares) / 1e10)
 *   scaled by 1e7  =>  (ta + v_assets) * 1e10 / (ts + v_shares), floored.
 */
export const sharePriceScaled = (ta, ts, offset = 3) => {
  const { A, S } = eff(ta, ts, offset);
  return (A * 10n ** 10n) / S;
};

/** Donation attack on a fresh vault: attacker donates D stroops, victim deposits V stroops. */
export const donationLab = (D, V, offset = 3) => {
  const d = big(D);
  const v = big(V);
  const off = 10n ** BigInt(offset);
  const expected = v * off;
  const naive = (v * (0n + off)) / (0n + d + 1n); // reference vault: +1 virtual asset, +10^offset virtual shares
  const { vA, vS } = anchor(offset);
  const karsa = (v * (0n + vS)) / (0n + d + vA);
  return { expected, naive, karsa, off, vA, vS };
};

/** Apply an action to a local preview state. Returns the new state and the action result. */
export const applyPreview = (state, kind, amount, offset = 3) => {
  const { totalAssets: ta, totalSupply: ts, shares } = state;
  const x = guard(amount);
  if (x === 0n) throw new RangeError("amount is zero");
  if (kind === "deposit") {
    const s = previewDeposit(x, ta, ts, offset);
    return { state: { ...state, totalAssets: ta + x, totalSupply: ts + s, shares: shares + s }, assets: x, shares: s };
  }
  if (kind === "mint") {
    const a = previewMint(x, ta, ts, offset);
    return { state: { ...state, totalAssets: ta + a, totalSupply: ts + x, shares: shares + x }, assets: a, shares: x };
  }
  if (kind === "withdraw") {
    const s = previewWithdraw(x, ta, ts, offset);
    if (s > shares) throw new RangeError("exceeds max_withdraw");
    return { state: { ...state, totalAssets: ta - x, totalSupply: ts - s, shares: shares - s }, assets: x, shares: s };
  }
  if (kind === "redeem") {
    if (x > shares) throw new RangeError("exceeds max_redeem");
    const a = previewRedeem(x, ta, ts, offset);
    return { state: { ...state, totalAssets: ta - a, totalSupply: ts - x, shares: shares - x }, assets: a, shares: x };
  }
  throw new Error(`unknown action ${kind}`);
};
