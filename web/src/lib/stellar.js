// Soroban Testnet + Freighter plumbing. Loaded lazily so the landing page stays light.
import {
  Account,
  Address,
  Contract,
  Keypair,
  TransactionBuilder,
  nativeToScVal,
  rpc,
  scValToNative,
} from "@stellar/stellar-sdk";
import {
  getAddress,
  getNetwork,
  isAllowed,
  isConnected,
  requestAccess,
  signTransaction,
} from "@stellar/freighter-api";
import { ASSET_DECIMALS, HORIZON_URL, NETWORK_PASSPHRASE, RPC_URL } from "./config";
import { parseUnits } from "./parse";

export class VaultError extends Error {
  constructor(code, detail) {
    super(detail ? `${code}: ${detail}` : code);
    this.name = "VaultError";
    this.code = code;
    this.detail = detail || "";
  }
}

const server = new rpc.Server(RPC_URL);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const i128 = (v) => nativeToScVal(BigInt(v), { type: "i128" });
const addr = (a) => new Address(a).toScVal();

/** "Error(Contract, #N)" exactly as the host reports it, else the first line of the message. */
export const contractErrorCode = (msg) => {
  const m = /Error\(Contract, #\d+\)/.exec(msg || "");
  if (m) return m[0];
  const host = /Error\([A-Za-z]+, [A-Za-z#0-9]+\)/.exec(msg || "");
  return host ? host[0] : String(msg || "").split("\n")[0].slice(0, 200);
};

const isNetworkError = (msg) => /fetch|network|timeout|timed out|ECONN|ENOTFOUND|50[0234]|429|Failed to fetch|aborted/i.test(msg);

const toRpcError = (error) => {
  if (error instanceof VaultError) return error;
  const msg = error?.message || String(error);
  if (isNetworkError(msg)) return new VaultError("RPC_UNREACHABLE", msg.split("\n")[0]);
  return new VaultError("SIMULATION_FAILED", contractErrorCode(msg));
};

const toWalletError = (error) => {
  const msg = error?.message || String(error);
  if (/declin|denied|reject|cancel|closed/i.test(msg)) return new VaultError("USER_REJECTED", msg);
  if (/not.*(install|connected|allowed)|no.*wallet|locked/i.test(msg)) return new VaultError("NO_WALLET", msg);
  if (/network|passphrase/i.test(msg)) return new VaultError("WRONG_NETWORK", msg);
  return new VaultError("SIMULATION_FAILED", msg);
};

const requireContract = (contractId) => {
  if (!contractId) throw new VaultError("CONTRACT_NOT_CONFIGURED");
  try {
    return new Contract(contractId);
  } catch (error) {
    throw new VaultError("CONTRACT_NOT_CONFIGURED", error?.message || "invalid contract ID");
  }
};

// Read-only calls are simulations: they need a source account shape but never touch the ledger,
// so a throwaway keypair works and nothing is signed or paid.
const readSource = () => new Account(Keypair.random().publicKey(), "0");

export const pingRpc = async () => {
  const t0 = performance.now();
  try {
    const h = await server.getHealth();
    if (h.status !== "healthy") throw new Error(`status ${h.status}`);
    return { ok: true, ms: Math.round(performance.now() - t0), ledger: h.latestLedger || 0 };
  } catch (error) {
    return { ok: false, error: (error?.message || String(error)).split("\n")[0] };
  }
};

export const readFn = async (contractId, fn, args = []) => {
  const contract = requireContract(contractId);
  let sim;
  try {
    const tx = new TransactionBuilder(readSource(), { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call(fn, ...args))
      .setTimeout(30)
      .build();
    sim = await server.simulateTransaction(tx);
  } catch (error) {
    throw toRpcError(error);
  }
  if (rpc.Api.isSimulationError(sim)) throw new VaultError("SIMULATION_FAILED", contractErrorCode(sim.error));
  return { value: sim.result?.retval ? scValToNative(sim.result.retval) : null, ledger: sim.latestLedger };
};

const big = (v) => BigInt(v ?? 0);

/** Vault totals plus, when an address is given, its KRS balance, limits and native XLM. */
export const readVault = async (contractId, address) => {
  const calls = [readFn(contractId, "total_assets"), readFn(contractId, "total_supply")];
  if (address) {
    calls.push(
      readFn(contractId, "balance", [addr(address)]),
      readFn(contractId, "max_withdraw", [addr(address)]),
      readFn(contractId, "max_redeem", [addr(address)]),
    );
  }
  const [ta, ts, bal, mw, mr] = await Promise.all(calls);
  const out = {
    totalAssets: big(ta.value),
    totalSupply: big(ts.value),
    ledger: Math.max(ta.ledger || 0, ts.ledger || 0),
    shares: 0n,
    maxWithdraw: 0n,
    maxRedeem: 0n,
    xlm: null,
  };
  if (address) {
    out.shares = big(bal.value);
    out.maxWithdraw = big(mw.value);
    out.maxRedeem = big(mr.value);
    out.shareValue = big((await readFn(contractId, "convert_to_assets", [i128(out.shares)])).value);
    out.xlm = await nativeBalance(address).catch(() => null);
  }
  return out;
};

const PREVIEW_FN = { deposit: "preview_deposit", mint: "preview_mint", withdraw: "preview_withdraw", redeem: "preview_redeem" };

/** On-chain preview_* through simulation. */
export const previewOnChain = async (contractId, kind, amount) => {
  const r = await readFn(contractId, PREVIEW_FN[kind], [i128(amount)]);
  return big(r.value);
};

export const nativeBalance = async (address) => {
  const res = await fetch(`${HORIZON_URL}/accounts/${address}`);
  if (res.status === 404) return 0n; // account not funded yet
  if (!res.ok) throw new VaultError("RPC_UNREACHABLE", `horizon ${res.status}`);
  const data = await res.json();
  const native = (data.balances || []).find((b) => b.asset_type === "native");
  return parseUnits(native?.balance || "0", ASSET_DECIMALS);
};

/* ---------------- Freighter ---------------- */

export const detectWallet = async () => {
  try {
    const r = await isConnected();
    return Boolean(r?.isConnected) && !r.error;
  } catch {
    return false;
  }
};

const readNetwork = async () => {
  const net = await getNetwork();
  if (net.error) throw toWalletError(net.error);
  return { network: net.network, passphrase: net.networkPassphrase, testnet: net.networkPassphrase === NETWORK_PASSPHRASE };
};

export const connectWallet = async () => {
  if (!(await detectWallet())) throw new VaultError("NO_WALLET");
  const allowed = await isAllowed();
  const access = allowed?.isAllowed ? await getAddress() : await requestAccess();
  if (access.error) throw toWalletError(access.error);
  if (!access.address) throw new VaultError("NO_WALLET");
  return { address: access.address, ...(await readNetwork()) };
};

/** Previously approved session, or null. Never prompts. */
export const currentWallet = async () => {
  if (!(await detectWallet())) return null;
  const allowed = await isAllowed();
  if (!allowed?.isAllowed) return null;
  const access = await getAddress();
  if (access.error || !access.address) return null;
  return { address: access.address, ...(await readNetwork()) };
};

const ACTIONS = new Set(["deposit", "mint", "withdraw", "redeem"]);

/**
 * deposit(assets, receiver, from, operator) / mint(shares, receiver, from, operator)
 * withdraw(assets, receiver, owner, operator) / redeem(shares, receiver, owner, operator)
 * The connected address fills every role, so only operator.require_auth() (the signer) is needed
 * and the vault pulls XLM from `from` inside the same authorized invocation; no approve step.
 */
export const execute = async ({ contractId, kind, amount, address, onStep }) => {
  const contract = requireContract(contractId);
  if (!ACTIONS.has(kind)) throw new VaultError("SIMULATION_FAILED", `unknown action ${kind}`);
  if (!address) throw new VaultError("NO_WALLET");
  const net = await readNetwork();
  if (!net.testnet) throw new VaultError("WRONG_NETWORK", net.network);

  onStep?.("simulating");
  let prepared;
  try {
    const account = await server.getAccount(address);
    const tx = new TransactionBuilder(account, { fee: "100", networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(contract.call(kind, i128(amount), addr(address), addr(address), addr(address)))
      .setTimeout(120)
      .build();
    prepared = await server.prepareTransaction(tx);
  } catch (error) {
    if (/account not found|Account not found/i.test(error?.message || "")) {
      throw new VaultError("SIMULATION_FAILED", "account not found on Testnet: fund it with Friendbot");
    }
    throw toRpcError(error);
  }

  onStep?.("signing");
  let signed;
  try {
    signed = await signTransaction(prepared.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE, address });
  } catch (error) {
    throw toWalletError(error);
  }
  if (signed?.error) throw toWalletError(signed.error);
  if (!signed?.signedTxXdr) throw new VaultError("USER_REJECTED", "Freighter returned no signed transaction");

  onStep?.("pending");
  let sent;
  try {
    sent = await server.sendTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE));
  } catch (error) {
    throw toRpcError(error);
  }
  if (sent.status === "ERROR") {
    throw new VaultError("TX_FAILED", sent.errorResult?.result?.()?.switch?.()?.name || "sendTransaction returned ERROR");
  }
  if (sent.status === "TRY_AGAIN_LATER") throw new VaultError("RPC_UNREACHABLE", "RPC asked to try again later");

  const started = Date.now();
  while (Date.now() - started < 90_000) {
    let res;
    try {
      res = await server.getTransaction(sent.hash);
    } catch {
      await sleep(1500);
      continue;
    }
    if (res.status === "SUCCESS") {
      const ret = res.returnValue ? big(scValToNative(res.returnValue)) : null;
      return { hash: sent.hash, result: ret, ledger: res.ledger };
    }
    if (res.status === "FAILED") {
      const e = new VaultError("TX_FAILED", `ledger ${res.ledger}`);
      e.hash = sent.hash;
      throw e;
    }
    await sleep(1200);
  }
  throw new VaultError("RPC_UNREACHABLE", `no result for ${sent.hash} after 90 s`);
};
