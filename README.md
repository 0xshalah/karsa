# Karsa Vault (KRS)

Vault tokenized **SEP-0056 v0.1.2** di Stellar Soroban Testnet dengan pengamanan **Virtual Liquidity Anchor**. Pengguna menyetor native Testnet XLM dan menerima share **KRS** (SEP-0041, 10 desimal) yang nilainya mencerminkan porsi kepemilikan pool aset.

> **Testnet only.** Tidak ada dana nyata. Kontrak tidak memiliki admin, upgrade, atau pause keys.

---

## Kontrak

| Item | Nilai |
|---|---|
| **Network** | Stellar Testnet (Protocol 29) |
| **Contract ID** | `CB7ZQKJBG7I7BOUJZAPYZ4RRG57RYOPC4S2YQBP3YBXOD4OWPNXAYJP4` |
| **Explorer** | https://stellar.expert/explorer/testnet/contract/CB7ZQKJBG7I7BOUJZAPYZ4RRG57RYOPC4S2YQBP3YBXOD4OWPNXAYJP4 |
| **Underlying Asset** | Native XLM via SAC `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |
| **Share Decimals** | **10** (Aset 7 + Offset 3) |
| **WASM SHA-256** | `e8947e736995f4c1c600efe278697a3b92a5422370046be35e1c9a76b3189d8a` |
| **Deploy Ledger** | `5367709` |
| **Web App Live** | https://karsa-vault.vercel.app |

Detail deployment lengkap tersedia di [`deployments/testnet.json`](./deployments/testnet.json).

---

## Kenapa Virtual Liquidity Anchor

Pada brankas standar tanpa likuiditas awal, donasi langsung dalam jumlah besar dapat memicu *donation attack* (inflasi harga share artifisial), menyebabkan penyetor berikutnya menerima share mendekati 0.

Karsa Vault menanamkan jangkar likuiditas virtual konstan:
* **Aset Virtual:** $1.000.000.000$ stroops ($100$ XLM virtual reserve).
* **Share Virtual:** $1.000.000.000.000$ raw shares ($10^{12}$ pada `decimals_offset = 3`).

Saat terjadi donasi masif ke brankas kosong, penyetor berikutnya tetap menerima $> 90\%$ hak sahamnya. Pembuktian matematis teruji di `contracts/karsa-vault/src/test.rs`.

---

## Struktur Repositori

```
contracts/karsa-vault/     Smart contract Soroban Rust (SEP-56 + SEP-41)
deployments/testnet.json   Alamat kontrak, WASM hash, dan rekaman deployment
docs/                      Catatan keputusan arsitektur (ADR)
PRD.md / TRD.md            Dokumen produk dan teknis resmi
web/                       Web app Vite + React (landing page + /app console)
```

---

## Build & Test

Prasyarat: Rust $\ge$ 1.84, target `wasm32v1-none`, Stellar CLI 28.x.

```bash
cd contracts/karsa-vault
cargo test                      # Menjalankan 7 unit tests (100% pass)
stellar contract build          # Menghasilkan release WASM (21.250 bytes)
```

Perintah deploy Testnet:

```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/karsa_vault.wasm \
  --source-account deployer --network testnet \
  -- --name "Karsa Vault" --symbol "KRS" \
     --asset CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC \
     --decimals_offset 3
```

---

## Web App

Direktori `web/` memuat antarmuka pengguna berbasis React 19 + Vite 8 dengan layout responsif 2 kolom:

```bash
cd web
npm install
npm run dev           # Jalankan server lokal di http://localhost:5173
npm test              # Uji unit Vitest (20 tests passing)
npm run build         # Build produksi ke web/dist
```

* **Landing Page:** `/` (Statistik brankas & simulasi interaktif)
* **Execution Console:** `/app` (Panel 2 kolom: Telemetri posisi & formulir Deposit/Mint/Withdraw/Redeem)

---

## Lisensi

MIT License
