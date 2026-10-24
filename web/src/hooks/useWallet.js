import { useCallback, useEffect, useRef, useState } from "react";

const loadStellar = () => import("../lib/stellar");
const SESSION_KEY = "karsa.wallet";
const store = {
  get: () => { try { return window.localStorage.getItem(SESSION_KEY); } catch { return null; } },
  set: (v) => { try { if (v) window.localStorage.setItem(SESSION_KEY, v); else window.localStorage.removeItem(SESSION_KEY); } catch { /* storage blocked */ } },
};

/**
 * Freighter connection state.
 * status: "idle" | "connecting" | "connected"
 * network/testnet come from Freighter's getNetwork and are re-checked every 4 s while connected.
 */
export const useWallet = () => {
  const [w, setW] = useState({ status: "idle", address: null, network: null, testnet: false, installed: null });
  const [error, setError] = useState(null);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    (async () => {
      const { detectWallet, currentWallet } = await loadStellar();
      const installed = await detectWallet();
      if (!alive.current) return;
      setW((s) => ({ ...s, installed }));
      if (!installed || !store.get()) return;
      const cur = await currentWallet().catch(() => null);
      if (alive.current && cur) setW({ status: "connected", installed: true, ...cur });
    })();
    return () => { alive.current = false; };
  }, []);

  useEffect(() => {
    if (w.status !== "connected") return undefined;
    const id = setInterval(async () => {
      const { currentWallet } = await loadStellar();
      const cur = await currentWallet().catch(() => null);
      if (!alive.current) return;
      if (!cur) setW((s) => ({ ...s, status: "idle", address: null, network: null, testnet: false }));
      else setW((s) => (s.address === cur.address && s.network === cur.network && s.testnet === cur.testnet ? s : { ...s, ...cur }));
    }, 4000);
    return () => clearInterval(id);
  }, [w.status]);

  const connect = useCallback(async () => {
    setError(null);
    setW((s) => ({ ...s, status: "connecting" }));
    try {
      const { connectWallet } = await loadStellar();
      const r = await connectWallet();
      store.set("1");
      setW({ status: "connected", installed: true, ...r });
    } catch (e) {
      setW((s) => ({ ...s, status: "idle" }));
      setError({ code: e.code || "NO_WALLET", detail: e.detail || e.message });
    }
  }, []);

  const disconnect = useCallback(() => {
    store.set(null);
    setW((s) => ({ ...s, status: "idle", address: null, network: null, testnet: false }));
  }, []);

  return { ...w, connected: w.status === "connected", error, setError, connect, disconnect };
};
