# Karsa Vault (KRS)

A SEP-0056 v0.1.2 tokenized vault on Stellar Soroban Testnet. You deposit native Testnet XLM and receive KRS shares (SEP-0041, 10 decimals). Share math counts a virtual liquidity anchor of 1,000,000,000 stroops (100 XLM) and 10^12 raw shares, so a direct donation into an empty vault cannot wipe out the next deposit.

This repository holds the web app: the landing page at `/` and the vault app at `/app`.

> Testnet only. Testnet XLM has no value. Never send Mainnet funds.

## Prerequisites

- Node.js 20.19 or newer (Vite 8), npm 10
- For signing: the [Freighter](https://www.freighter.app/) browser extension, switched to **Testnet**, with an account funded by Friendbot

## Start

```bash
cd web && npm install && npm run dev      # http://localhost:5173
```

Other scripts (run inside `web/`):

| Command | What it does |
|---|---|
| `npm run build` | production build into `web/dist` |
| `npm run preview` | serves the build on http://localhost:4173 |
| `npm test` | Vitest unit tests (vault math, rounding, config) |
| `npm run e2e` | Playwright against `vite preview` (`npx playwright install chromium` first, or set `PW_CHROMIUM=/path/to/chrome`) |

## Set the contract ID

The app looks for a Testnet contract ID in this order and uses the first valid one:

1. **This browser:** `/app` → *Change Contract ID* (stored in `localStorage` under `karsa.contractId`). *Remove override* clears it.
2. **Build env:** `VITE_VAULT_CONTRACT_ID=C...` in `web/.env.local` or the Vercel project settings.
3. **Repo file:** `contract_id` in [`deployments/testnet.json`](deployments/testnet.json). Fill in `xlm_sac`, `deployed_at` and `deploy_ledger` at the same time.

An ID must match `^C[A-Z2-7]{55}$` and carry a valid strkey checksum.

With no ID anywhere, `/app` runs as a **local preview**: the same integer math in your browser, labelled "Contract not configured", and nothing is read from or sent to the chain. Once an ID is set:

- vault totals, share price, your KRS balance, `max_withdraw`, `max_redeem` and `convert_to_assets` are read from the contract through Soroban RPC simulation;
- previews call `preview_deposit`, `preview_mint`, `preview_withdraw`, `preview_redeem` on-chain;
- with Freighter connected on Testnet, `deposit`, `mint`, `withdraw` and `redeem` are built, simulated with `prepareTransaction`, signed in Freighter, sent, and polled until SUCCESS or FAILED. The receipt links to Stellar Expert.

The connected address is passed as `receiver`, `from`/`owner` and `operator`, so the signer's own authorization covers the call and no `approve` step is needed (see [`docs/decisions.md`](docs/decisions.md)).

## Deploy (Vercel)

`vercel.json` builds `web/` and rewrites every path to `index.html`, so `/app` deep links work.

## Not supported

- Mainnet. The network passphrase is fixed to Testnet and signing is blocked on any other Freighter network.
- Wallets other than Freighter.
- Third-party `receiver`, `from`, `owner` or `operator` addresses, and share allowances (`approve` on KRS). The contract supports them; this UI does not expose them.
- The smart contract is located at `contracts/karsa-vault/` (compiled with Rust Soroban SDK 26.1.1, deployed to Testnet).

## Layout

```
contracts/karsa-vault/      Hardened SEP-0056 Soroban Rust contract with Virtual Liquidity Anchor
DESIGN.md                  Karsa design tokens (Google DESIGN.md format)
deployments/testnet.json   Testnet deployment record (contract ID: CB7ZQKJBG7I7BOUJZAPYZ4RRG57RYOPC4S2YQBP3YBXOD4OWPNXAYJP4)
docs/decisions.md          choices made while building the app
vercel.json                SPA rewrite
web/                       Vite + React app
  src/pages/Landing.jsx    /
  src/pages/VaultApp.jsx   /app
  src/lib/vault-math.js    BigInt SEP-0056 math with the virtual anchor
  src/lib/stellar.js       Soroban RPC + Freighter
  src/lib/config.js        contract ID resolution
  e2e/                     Playwright tests
```
