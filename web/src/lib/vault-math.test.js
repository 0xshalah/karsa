import { describe, expect, it } from "vitest";
import {
  I128_MAX,
  anchor,
  applyPreview,
  convertToAssets,
  convertToShares,
  donationLab,
  previewDeposit,
  previewMint,
  previewRedeem,
  previewWithdraw,
  sharePriceScaled,
} from "./vault-math";
import { fmtDec, fmtPct, xlm } from "./format";
import { parseUnits, toInput } from "./parse";

describe("virtual liquidity anchor", () => {
  it("uses v_assets = 1e9 stroops and v_shares = v_assets * 10^3", () => {
    expect(anchor(3)).toEqual({ vA: 1_000_000_000n, vS: 1_000_000_000_000n });
  });
});

describe("donation attack (PRD §3.5 vector)", () => {
  const m = donationLab(50_000_000n, 5_000_000n, 3);
  it("naive vault gives the victim 99 shares (0.000002%)", () => {
    expect(m.naive).toBe(99n);
    expect(fmtPct(m.naive, m.expected)).toBe("0.000002%");
  });
  it("Karsa gives 4,761,904,761 shares (95.24%) of 5,000,000,000 expected", () => {
    expect(m.expected).toBe(5_000_000_000n);
    expect(m.karsa).toBe(4_761_904_761n);
    expect(fmtPct(m.karsa, m.expected)).toBe("95.24%");
  });
});

describe("share price", () => {
  it("fresh vault prices 1 KRS at 1.0000000 XLM", () => {
    expect(xlm(sharePriceScaled(0n, 0n, 3))).toBe("1.0000000");
  });
  it("matches ((ta + vA)/1e7) / ((ts + vS)/1e10) after deposits", () => {
    const ta = 110_000_000n;
    const ts = previewDeposit(ta, 0n, 0n, 3);
    expect(ts).toBe(110_000_000_000n);
    expect(xlm(sharePriceScaled(ta, ts, 3))).toBe("1.0000000");
  });
  it("rises when assets grow without new shares (donation of 10 XLM)", () => {
    // (0 + 1e9 + 1e8) * 1e10 / (0 + 1e12) = 11,000,000 -> 1.1000000
    expect(xlm(sharePriceScaled(100_000_000n, 0n, 3))).toBe("1.1000000");
  });
});

describe("rounding directions", () => {
  // A state where divisions are not exact: assets 1,000,000,007 + vA, supply 999,999,999,999 + vS
  const ta = 1_000_000_007n;
  const ts = 999_999_999_999n;
  const A = ta + 1_000_000_000n;
  const S = ts + 1_000_000_000_000n;
  const x = 12_345_677n;

  it("preview_deposit floors", () => {
    expect(previewDeposit(x, ta, ts)).toBe((x * S) / A);
    expect((x * S) % A).not.toBe(0n);
  });
  it("preview_mint ceils", () => {
    const exact = (x * A) / S;
    expect((x * A) % S).not.toBe(0n);
    expect(previewMint(x, ta, ts)).toBe(exact + 1n);
  });
  it("preview_withdraw ceils", () => {
    expect(previewWithdraw(x, ta, ts)).toBe((x * S) / A + 1n);
  });
  it("preview_redeem floors", () => {
    expect(previewRedeem(x, ta, ts)).toBe((x * A) / S);
  });
  it("ceil is never below floor for the same input", () => {
    expect(previewWithdraw(x, ta, ts)).toBeGreaterThanOrEqual(convertToShares(x, ta, ts));
    expect(previewMint(x, ta, ts)).toBeGreaterThanOrEqual(convertToAssets(x, ta, ts));
  });
  it("exact divisions do not round up", () => {
    expect(previewMint(10_000_000_000n, 0n, 0n)).toBe(10_000_000n);
    expect(previewWithdraw(10_000_000n, 0n, 0n)).toBe(10_000_000_000n);
  });
  it("rejects negative and > i128::MAX inputs", () => {
    expect(() => previewDeposit(-1n, 0n, 0n)).toThrow(/negative/);
    expect(() => previewDeposit(I128_MAX + 1n, 0n, 0n)).toThrow(/i128/);
  });
});

describe("PRD action vectors on a fresh vault (local preview)", () => {
  it("deposit 5,000,000 -> mint 3,000,000 -> withdraw 2,000,000 -> redeem 1,000,000", () => {
    let s = { totalAssets: 0n, totalSupply: 0n, shares: 0n };
    let r = applyPreview(s, "deposit", 5_000_000n); s = r.state;
    expect(r.shares).toBe(5_000_000_000n);
    r = applyPreview(s, "mint", 3_000_000n); s = r.state;
    expect(r.assets).toBe(3_000n);
    r = applyPreview(s, "withdraw", 2_000_000n); s = r.state;
    expect(r.shares).toBe(2_000_000_000n);
    r = applyPreview(s, "redeem", 1_000_000n); s = r.state;
    expect(r.assets).toBe(1_000n);
    expect(s.totalAssets).toBe(5_000_000n + 3_000n - 2_000_000n - 1_000n);
    expect(s.shares).toBe(5_000_000_000n + 3_000_000n - 2_000_000_000n - 1_000_000n);
  });
  it("blocks redeem beyond the balance", () => {
    expect(() => applyPreview({ totalAssets: 0n, totalSupply: 0n, shares: 0n }, "redeem", 1n)).toThrow(/max_redeem/);
  });
});

describe("units", () => {
  it("parses XLM to stroops and KRS to raw without floats", () => {
    expect(parseUnits("0.5", 7)).toBe(5_000_000n);
    expect(parseUnits("1", 10)).toBe(10_000_000_000n);
    expect(parseUnits("0.12345678", 7)).toBeNull();
    expect(toInput(5_000_000n, 7)).toBe("0.5");
    expect(fmtDec(4_761_904_761n, 10)).toBe("0.4761904761");
  });
});
