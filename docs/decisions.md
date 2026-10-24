# Decisions

Short records of choices made while building the web app. Newest last.

## Vite + React, plain CSS
The landing page already existed as hand-written CSS with Karsa's tokens. It was ported as-is (`web/src/styles/landing.css`) and the app adds `app.css` on the same variables. Tailwind and shadcn were not needed; the app has a handful of components.

## Dependencies
Runtime: `react`, `react-dom`, `react-router-dom`, `@stellar/stellar-sdk`, `@stellar/freighter-api`. Dev: `vite`, `@vitejs/plugin-react`, `vitest`, `@playwright/test`. Nothing else. No icon library: the only glyphs are the inline brand mark, an arrow on the primary CTA and the step marks in the transaction dialog.

## The SDK loads lazily
`stellar.js` (about 570 kB, 116 kB gzipped) is a dynamic import. The landing page renders without it and loads it when it pings RPC or reads the contract.

## Contract ID precedence: localStorage > VITE_VAULT_CONTRACT_ID > deployments/testnet.json
The browser override lets the owner try a fresh deployment without a rebuild; the env var suits Vercel; the JSON file is the committed record. The landing page and `/app` share one provider, so a change in either is used by both. Validation is the regex plus the strkey CRC16 checksum (implemented in `config.js` so the landing bundle stays free of the SDK); a regex-only check let `CAAA…A` through and the SDK then refused it.

## Read-only calls use a throwaway source account
Reads are `simulateTransaction` calls, which need a source account shape but never touch the ledger. A random keypair with sequence 0 works, so no funded "read account" is hard-coded. Checked against a live Testnet contract before relying on it.

## No `approve` before deposit or mint
PRD §3.5 item 4: `operator.require_auth()` always; `from.require_auth()` only when `operator != from`; share allowance only when `operator != owner`. The app passes the connected address as receiver, from/owner and operator, so the signer's own auth tree covers the vault's XLM pull through the native SAC. An `approve` + `transfer_from` flow is only needed for a third-party operator, which this UI does not offer.

## Preview mode
"Preview" means local, never "simulated on-chain". It runs when no contract ID is set, or when Freighter is not connected on Testnet. With a contract ID set and before any preview action, numbers come from the chain (totals, `preview_*`); after the first preview action the local copy diverges and every number switches to "computed locally". The preview log says its rows are not transactions. It has no wallet balance: it never invents XLM, it only limits withdraw and redeem to the preview position.

## Wrong network blocks actions
When Freighter reports a passphrase other than Testnet, the submit button reads "Switch Freighter to Testnet" and is disabled, and a danger notice shows the network name. `execute` re-checks the network right before building the transaction.

## Errors
Typed codes: `NO_WALLET`, `WRONG_NETWORK`, `USER_REJECTED`, `SIMULATION_FAILED`, `RPC_UNREACHABLE`, `CONTRACT_NOT_CONFIGURED`, plus `TX_FAILED` for a transaction the ledger included but failed (it carries the hash). `SIMULATION_FAILED` shows the host's `Error(Contract, #N)` (or `Error(Storage, MissingValue)` etc.) verbatim.

## Share price
`((total_assets + v_assets) / 1e7) / ((total_supply + v_shares) / 1e10)`, computed as `(ta + vA) * 1e10 / (ts + vS)` in BigInt and shown with 7 decimals. Fresh vault: 1.0000000 XLM per KRS.

## Language
`#lang=id` or `?lang=id` on load, kept in memory, written back to the hash; links between `/` and `/app` carry it. No theme toggle.

## The landing banner says "Live on Stellar Soroban Testnet"
That is the owner's wording and it stays, em dash included. Until a contract ID is configured, the stats panel says under the numbers that they are fresh-vault defaults, and `/app` says "Contract not configured".
