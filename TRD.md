# TRD: Karsa Vault

**Technical Requirements & Implementation Document**

| Parameter | Value |
|---|---|
| Version | 1.0 (Testnet Live) |
| Author | Shalahuddin Al-Ayyubi |
| Contract ID | `CB7ZQKJBG7I7BOUJZAPYZ4RRG57RYOPC4S2YQBP3YBXOD4OWPNXAYJP4` |
| SDK Version | `soroban-sdk = "=26.1.1"`, `stellar-tokens = "=0.7.2"`, `stellar-contract-utils = "=0.7.3"` |
| Target Protocol | Stellar Testnet Protocol 29 |

---

## 1. Architectural Decisions (ADR)

| ID | Decision | Rationale |
|---|---|---|
| **AD-01** | **Internal Virtual Liquidity Anchor** | Standard empty vaults using $+1$ stroop virtual asset fail under massive donation attacks. An internal $10^9$ stroop anchor preserves $> 90\%$ of shares for subsequent depositors without needing administrator keys or manual seeding. |
| **AD-02** | **Strict SEP-0056 v0.1.2 Conformance** | Maintain exact standard ABI including `__constructor` and trait methods so any ecosystem protocol or automated checker interacts seamlessly. |
| **AD-03** | **Dual Asset Alias Export** | Export both `query_asset(e: &Env)` and `asset(e: &Env)` returning the underlying token address to support both SEP-56 drafts and client libraries. |
| **AD-04** | **Vite 8 + React 2-Column Responsive Layout** | Clean 1100px max-width layout separating telemetry/position stats on the left and the transaction execution console on the right for optimal DeFi UX. |
| **AD-05** | **No Third-Party Backend Required** | All read operations simulate directly against Soroban RPC (`simulateTransaction`), maintaining 100% decentralized state transparency. |

---

## 2. Mathematical Specification

### 2.1. Anchor Equations
Let:
* $A = \text{total\_assets}$
* $S = \text{total\_supply}$
* $v_A = 10^9$ (Virtual Assets)
* $v_S = 10^{12}$ (Virtual Shares for offset 3)

### 2.2. Operations
$$\text{convert\_to\_shares}(a) = \left\lfloor \frac{a \times (S + v_S)}{A + v_A} \right\rfloor$$

$$\text{convert\_to\_assets}(s) = \left\lfloor \frac{s \times (A + v_A)}{S + v_S} \right\rfloor$$

$$\text{preview\_mint}(s) = \left\lceil \frac{s \times (A + v_A)}{S + v_S} \right\rceil$$

$$\text{preview\_withdraw}(a) = \left\lceil \frac{a \times (S + v_S)}{A + v_A} \right\rceil$$

---

## 3. Events Interface

```rust
#[contractevent]
pub struct Deposit {
    #[topic]
    pub operator: Address,
    #[topic]
    pub from: Address,
    #[topic]
    pub receiver: Address,
    pub assets: i128,
    pub shares: i128,
}

#[contractevent]
pub struct Withdraw {
    #[topic]
    pub operator: Address,
    #[topic]
    pub receiver: Address,
    #[topic]
    pub owner: Address,
    pub assets: i128,
    pub shares: i128,
}
```

---

## 4. Testnet Verification Metrics

* **Contract WASM Hash:** `e8947e736995f4c1c600efe278697a3b92a5422370046be35e1c9a76b3189d8a`
* **Deploy Ledger:** `5367709`
* **Exported Functions:** 27 functions
* **Unit Test Suite:** 7/7 unit tests passing (100%)
* **Production Web Domain:** https://karsa-vault.vercel.app
