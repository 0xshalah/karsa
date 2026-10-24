import { describe, expect, it } from "vitest";
import { isValidContractId, resolveContractId, TOKEN } from "./config";
import { contractErrorCode } from "./stellar";

describe("contract ID config", () => {
  it("validates ^C[A-Z2-7]{55}$ plus the strkey checksum", () => {
    expect(isValidContractId("CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4")).toBe(true);
    expect(isValidContractId("CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR")).toBe(true);
    expect(isValidContractId("CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC")).toBe(true);
    expect(isValidContractId(`C${"A".repeat(55)}`)).toBe(false); // right shape, bad checksum
    expect(isValidContractId(`G${"A".repeat(55)}`)).toBe(false);
    expect(isValidContractId(`C${"A".repeat(54)}`)).toBe(false);
    expect(isValidContractId(`C${"A".repeat(54)}1`)).toBe(false);
  });
  it("resolves the deployed contract ID or falls back when empty", () => {
    const resolved = resolveContractId();
    if (resolved.id) {
      expect(isValidContractId(resolved.id)).toBe(true);
      expect(["local", "env", "file"]).toContain(resolved.source);
    } else {
      expect(resolved).toEqual({ id: null, source: "none" });
    }
  });
  it("reads the KRS token block from deployments/testnet.json", () => {
    expect(TOKEN).toEqual({ name: "Karsa Vault", symbol: "KRS", decimals: 10, asset_decimals: 7, decimals_offset: 3 });
  });
});

describe("contract error codes", () => {
  it("keeps the host's Error(Contract, #N) verbatim", () => {
    expect(contractErrorCode("HostError: Error(Contract, #404)\n\nEvent log ...")).toBe("Error(Contract, #404)");
    expect(contractErrorCode("HostError: Error(Auth, InvalidAction)")).toBe("Error(Auth, InvalidAction)");
  });
});
