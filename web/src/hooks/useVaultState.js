import { useCallback, useEffect, useRef, useState } from "react";

const loadStellar = () => import("../lib/stellar");

/**
 * Live vault state from Soroban Testnet when a contract ID is configured.
 * status: "none" (no contract ID) | "loading" | "live" | "error"
 */
export const useVaultState = (contractId, address, { interval = 15000 } = {}) => {
  const [st, setSt] = useState({ status: contractId ? "loading" : "none", data: null, error: null });
  const seq = useRef(0);

  const refresh = useCallback(async () => {
    if (!contractId) {
      setSt({ status: "none", data: null, error: null });
      return;
    }
    const my = ++seq.current;
    setSt((s) => ({ ...s, status: s.data ? s.status : "loading" }));
    try {
      const { readVault } = await loadStellar();
      const data = await readVault(contractId, address);
      if (my === seq.current) setSt({ status: "live", data, error: null });
    } catch (e) {
      if (my === seq.current) setSt({ status: "error", data: null, error: { code: e.code || "SIMULATION_FAILED", detail: e.detail || e.message } });
    }
  }, [contractId, address]);

  useEffect(() => {
    refresh();
    if (!contractId) return undefined;
    const id = setInterval(refresh, interval);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, contractId, interval]);

  return { ...st, refresh };
};

export const useRpcHealth = () => {
  const [net, setNet] = useState({ state: "checking" });
  const ping = useCallback(async () => {
    setNet({ state: "checking" });
    const { pingRpc } = await loadStellar();
    const r = await pingRpc();
    setNet(r.ok ? { state: "live", ms: r.ms, ledger: r.ledger } : { state: "down", err: r.error });
  }, []);
  useEffect(() => {
    ping();
  }, [ping]);
  return { net, ping };
};
