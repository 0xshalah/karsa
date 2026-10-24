# PRD: Karsa Vault

> **Status:** Live Testnet Implementation  
> **Owner:** Shalahuddin Al-Ayyubi  
> **Network:** Stellar Soroban Testnet  
> **Token Share:** Karsa Vault Shares (KRS)  
> **Underlying Asset:** Native Testnet XLM (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`)  
> **Specification:** SEP-0056 v0.1.2 + SEP-0041 Token Interface  

---

## 1. Executive Summary

**Problem:**  
In standard SEP-0056 and ERC-4626 implementations, empty vaults are vulnerable to **Donation / Inflation Attacks** due to a fragile minimum denominator constant (`+1 stroop`). When a bad actor seeds a vault with a minimal deposit and directly donates large asset quantities, share prices spike artificially, diluting subsequent depositors' shares to near-zero (often 0% on automated checkers).

**Solution:**  
Karsa Vault implements an internal **Virtual Liquidity Anchor** ($1,000,000,000$ stroops = 100 XLM virtual reserve, $10^{12}$ virtual shares at decimals offset 3). This dampens artificial price manipulation while preserving strict SEP-0056 v0.1.2 conformance, ensuring fresh vaults remain mathematically resilient without requiring administrative keys, lockups, or artificial deposit restrictions.

**Key Architecture Principles:**
1. **Zero Protocol Deviation:** Strict `__constructor` and trait methods (`query_asset`, `convert_to_*`, `preview_*`, `deposit`, `mint`, `withdraw`, `redeem`).
2. **Permissionless & Non-Custodial:** No admin key, no upgradeability mechanism, no pause flags, no whitelist, and zero protocol fees.
3. **Exact Accounting:** All share math uses 128-bit checked arithmetic with internal $I256$ intermediate scaling via `mul_div_with_rounding`.

---

## 2. Product Specifications

### 2.1. Tokenomics & Decimals Geometry
* **Underlying Asset:** Native Stellar Testnet XLM (SAC, 7 decimals).
* **Decimals Offset:** `3` (enforced during initialization).
* **Share Decimals:** `10` ($7 + 3$).
* **Virtual Asset Constant:** $10^9$ stroops ($100$ XLM).
* **Virtual Share Constant:** $10^{12}$ raw units ($10^9 \times 10^3$).

### 2.2. Conversion Invariants
* **Asset to Shares (Floor):**
  $$\text{shares} = \left\lfloor \frac{\text{assets} \times (\text{total\_supply} + 10^{12})}{\text{total\_assets} + 10^9} \right\rfloor$$
* **Shares to Assets (Floor):**
  $$\text{assets} = \left\lfloor \frac{\text{shares} \times (\text{total\_assets} + 10^9)}{\text{total\_supply} + 10^{12}} \right\rfloor$$
* **Rounding Favoritism:** Always in favor of the vault over transactors (Floor for `deposit`/`redeem`, Ceil for `mint`/`withdraw`).

---

## 3. Core User Flows

1. **Deposit XLM:**  
   User deposits an exact amount of XLM and receives newly minted KRS shares calculated via `preview_deposit`.
2. **Mint KRS:**  
   User specifies an exact number of KRS shares to mint; the vault pulls the exact amount of XLM determined by `preview_mint`.
3. **Withdraw XLM:**  
   User withdraws a specific quantity of XLM; the vault burns the previewed shares (`preview_withdraw`) from the user's balance.
4. **Redeem KRS:**  
   User burns KRS shares to receive underlying XLM (`preview_redeem`).

---

## 4. Contract Configuration

| Parameter | Value |
|---|---|
| Contract ID | `CB7ZQKJBG7I7BOUJZAPYZ4RRG57RYOPC4S2YQBP3YBXOD4OWPNXAYJP4` |
| Native XLM SAC | `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| Share Token Name | Karsa Vault |
| Share Token Symbol | KRS |
| Decimals Offset | 3 |
| Production Web URL | https://karsa-vault.vercel.app |
