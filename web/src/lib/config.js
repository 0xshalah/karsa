import deployment from "../../../deployments/testnet.json";

const env = import.meta.env;

export const RPC_URL = env.VITE_SOROBAN_RPC_URL || deployment.rpc_url;
export const HORIZON_URL = env.VITE_HORIZON_URL || deployment.horizon_url;
export const NETWORK_PASSPHRASE = deployment.network_passphrase;

export const TOKEN = deployment.token; // Karsa Vault / KRS / 10 / 7 / 3
export const ASSET_DECIMALS = TOKEN.asset_decimals; // XLM: 7
export const SHARE_DECIMALS = TOKEN.decimals; // KRS: 7 + offset 3 = 10
export const DECIMALS_OFFSET = TOKEN.decimals_offset; // 3

export const CONTRACT_KEY = "karsa.contractId";
const CID_RE = /^C[A-Z2-7]{55}$/;
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

// CRC16-XModem, the checksum Stellar strkeys carry in their last two bytes.
const crc16 = (bytes) => {
  let crc = 0;
  for (const b of bytes) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i += 1) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc;
};

/** Shape check (^C[A-Z2-7]{55}$) only. */
export const looksLikeContractId = (id) => CID_RE.test(id || "");

/** Shape plus strkey checksum: version byte 0x10 ("C"), 32-byte hash, CRC16 little-endian. */
export const isValidContractId = (id) => {
  if (!looksLikeContractId(id)) return false;
  let bits = 0;
  let acc = 0;
  const out = [];
  for (const ch of id) {
    acc = (acc << 5) | B32.indexOf(ch);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((acc >> bits) & 0xff);
    }
  }
  if (out.length !== 35 || out[0] !== 0x10) return false;
  const sum = crc16(out.slice(0, 33));
  return out[33] === (sum & 0xff) && out[34] === (sum >> 8);
};

const fromStorage = () => {
  try {
    const v = window.localStorage.getItem(CONTRACT_KEY);
    return isValidContractId(v) ? v : null;
  } catch {
    return null; // storage blocked (private mode, sandboxed iframe)
  }
};

/**
 * Contract ID resolution, highest first:
 *   1. localStorage "karsa.contractId" (set with "Change Contract ID")
 *   2. VITE_VAULT_CONTRACT_ID at build time
 *   3. deployments/testnet.json contract_id
 * Returns { id, source } with id = null when nothing valid is configured.
 */
export const resolveContractId = () => {
  const stored = fromStorage();
  if (stored) return { id: stored, source: "local" };
  if (isValidContractId(env.VITE_VAULT_CONTRACT_ID)) return { id: env.VITE_VAULT_CONTRACT_ID, source: "env" };
  if (isValidContractId(deployment.contract_id)) return { id: deployment.contract_id, source: "file" };
  return { id: null, source: "none" };
};

export const saveContractId = (id) => {
  try {
    if (id) window.localStorage.setItem(CONTRACT_KEY, id);
    else window.localStorage.removeItem(CONTRACT_KEY);
    return true;
  } catch {
    return false;
  }
};

export const LINKS = {
  sep56: "https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0056.md",
  x: "https://x.com/karsavault",
  freighter: "https://www.freighter.app/",
  friendbot: (a) => `https://friendbot.stellar.org/?addr=${a}`,
  explorer: (id) => `https://stellar.expert/explorer/testnet/contract/${id}`,
  explorerRoot: "https://stellar.expert/explorer/testnet",
  tx: (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
};
