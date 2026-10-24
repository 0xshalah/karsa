import { useCallback, useEffect, useMemo, useState } from "react";
import { A, errCopy } from "../lib/app-copy";
import { makeT, useLang } from "../lib/i18n";
import { LINKS } from "../lib/config";
import { useContract } from "../lib/contract";
import { useVaultState } from "../hooks/useVaultState";
import { useWallet } from "../hooks/useWallet";
import { applyPreview, convertToAssets } from "../lib/vault-math";
import { fmtDec, fmtInt, xlm } from "../lib/format";
import { WalletBar } from "../components/app/WalletBar";
import { Notice } from "../components/app/Notice";
import { VaultStats } from "../components/app/VaultStats";
import { PositionCard } from "../components/app/PositionCard";
import { ActionPanel, KINDS } from "../components/app/ActionPanel";
import { TxDialog } from "../components/app/TxDialog";
import { ContractIdBar } from "../components/ContractIdBar";

const FRESH = { totalAssets: 0n, totalSupply: 0n, shares: 0n };
const STEP_IDX = { simulating: 0, signing: 1, pending: 2 };

export default function VaultApp() {
  const { lang } = useLang();
  const t = useMemo(() => makeT(A, lang), [lang]);
  const { id: contractId } = useContract();
  const wallet = useWallet();
  const live = Boolean(contractId && wallet.connected && wallet.testnet);
  const mode = live ? "live" : "preview";
  const vs = useVaultState(contractId, wallet.connected ? wallet.address : null);

  const [tab, setTab] = useState("deposit");
  const [tx, setTx] = useState(null);
  const [preview, setPreview] = useState({ ...FRESH, log: [], seededAt: null });
  const [flash, setFlash] = useState("");

  useEffect(() => {
    document.title = lang === "id" ? "Karsa Vault · App Testnet" : "Karsa Vault · Testnet app";
  }, [lang]);

  // Seed the local preview from the chain until the user runs a preview action.
  useEffect(() => {
    setPreview((p) => {
      if (p.log.length) return p;
      if (!contractId) return { ...FRESH, log: [], seededAt: null };
      if (vs.status === "live") return { totalAssets: vs.data.totalAssets, totalSupply: vs.data.totalSupply, shares: 0n, log: [], seededAt: vs.data.ledger };
      return p;
    });
  }, [contractId, vs.status, vs.data]);

  const chainData = vs.status === "live" ? vs.data : null;
  const previewTouched = preview.log.length > 0;
  const statsFromChain = Boolean(contractId) && !(mode === "preview" && previewTouched);
  const statsState = statsFromChain ? chainData : preview;
  let statsSource;
  if (statsFromChain) statsSource = vs.status === "live" ? t("st_live", { l: fmtInt(chainData.ledger || 0) }) : t("st_loading");
  else statsSource = preview.seededAt ? t("st_local_seeded", { l: fmtInt(preview.seededAt) }) : t("st_local");

  const base = mode === "live" ? chainData || FRESH : preview;
  const chain = contractId && (mode === "live" || !previewTouched) ? { contractId } : null;
  const limits = mode === "live"
    ? (chainData ? { maxWithdraw: chainData.maxWithdraw, maxRedeem: chainData.maxRedeem, xlm: chainData.xlm } : null)
    : { maxWithdraw: convertToAssets(preview.shares, preview.totalAssets, preview.totalSupply), maxRedeem: preview.shares, xlm: null };
  const pos = mode === "live"
    ? (chainData ? { shares: chainData.shares, value: chainData.shareValue ?? 0n, maxWithdraw: chainData.maxWithdraw, maxRedeem: chainData.maxRedeem, xlm: chainData.xlm } : null)
    : { shares: preview.shares, value: convertToAssets(preview.shares, preview.totalAssets, preview.totalSupply), maxWithdraw: limits.maxWithdraw, maxRedeem: preview.shares, xlm: null };
  const wrongNet = wallet.connected && !wallet.testnet;

  const submitLabel = (kind) => {
    if (wrongNet && contractId) return t("btn_blocked_net");
    return mode === "live" ? t("btn_live", { a: t(`tab_${kind}`) }) : t("btn_preview", { a: t(`tab_${kind}`) });
  };

  const runLive = useCallback(async (kind, amount) => {
    let at = 0;
    setTx({ kind, amount, step: "simulating" });
    try {
      const { execute } = await import("../lib/stellar");
      const r = await execute({
        contractId, kind, amount, address: wallet.address,
        onStep: (s) => { at = STEP_IDX[s]; setTx((x) => ({ ...x, step: s })); },
      });
      setTx((x) => ({ ...x, step: "success", hash: r.hash, result: r.result, ledger: r.ledger }));
      vs.refresh();
    } catch (e) {
      setTx((x) => ({ ...x, step: "failed", failedAt: at, hash: e.hash, error: { code: e.code || "SIMULATION_FAILED", detail: e.detail || e.message } }));
    }
  }, [contractId, wallet.address, vs]);

  const runPreview = (kind, amount) => {
    try {
      const r = applyPreview(preview, kind, amount, 3);
      const k = KINDS[kind];
      const out = kind === "deposit" || kind === "withdraw" ? r.shares : r.assets;
      const outText = `${k.outDec === 7 ? xlm(out) : fmtDec(out, 10)} ${k.outUnit}`;
      setPreview((p) => ({ ...r.state, seededAt: p.seededAt, log: [{ n: p.log.length + 1, kind, assets: r.assets, shares: r.shares }, ...p.log] }));
      setFlash(t("preview_done", { fn: kind, r: outText }));
    } catch (e) {
      setFlash(String(e.message));
    }
  };

  const onSubmit = (kind, amount) => {
    setFlash("");
    if (mode === "live") runLive(kind, amount);
    else if (!(wrongNet && contractId)) runPreview(kind, amount);
  };

  const resetPreview = () => {
    setFlash("");
    setPreview(chainData && contractId
      ? { totalAssets: chainData.totalAssets, totalSupply: chainData.totalSupply, shares: 0n, log: [], seededAt: chainData.ledger }
      : { ...FRESH, log: [], seededAt: null });
  };

  const err = wallet.error ? errCopy(wallet.error.code, lang, { net: wallet.network || "?" }) : null;
  const readErr = vs.status === "error" ? errCopy(vs.error.code, lang) : null;
  const netErr = wrongNet ? errCopy("WRONG_NETWORK", lang, { net: wallet.network || "?" }) : null;

  return (
    <div className="page app" data-testid="vault-app" data-mode={mode}>
      <WalletBar t={t} lang={lang} wallet={wallet} />
      <main id="main" className="app-main">
        <div className="wrap app-wrap">
          <p className="notice" role="note" data-testid="app-banner">{t("testnet_note")}</p>
          <p className="label">{t("eyebrow")}</p>
          <h1 className="app-h1">{t("title")}</h1>
          <p className="sub app-sub">{t("sub")}</p>

          <div className="stack">
            {!contractId && <Notice tone="warn" title={t("m_none_t")} testid="mode-notice" code="CONTRACT_NOT_CONFIGURED">{t("m_none_d")}</Notice>}
            {contractId && mode === "preview" && <Notice tone="warn" title={t("m_wallet_t")} testid="mode-notice">{t("m_wallet_d")}</Notice>}
            {mode === "live" && <Notice tone="ok" title={t("mode_live")} testid="mode-notice">{t("m_live_d")}</Notice>}
            {netErr && <Notice tone="danger" title={netErr.t} testid="wrong-network" code="WRONG_NETWORK">{netErr.d}</Notice>}
            {wallet.installed === false && !wallet.connected && (
              <Notice tone="info" title={t("install_t")} testid="install-hint"
                action={<a className="btn btn-ghost btn-sm" href={LINKS.freighter} target="_blank" rel="noreferrer">{t("install_cta")}</a>}>
                {t("install_d")}
              </Notice>
            )}
            {err && (
              <Notice tone="danger" title={err.t} testid="wallet-error" code={wallet.error.code}
                action={<button type="button" className="linkbtn" onClick={() => wallet.setError(null)}>{t("dismiss")}</button>}>
                {err.d}
              </Notice>
            )}
            {readErr && (
              <Notice tone="danger" title={readErr.t} testid="read-error" code={`${vs.error.code}${vs.error.detail ? ` · ${vs.error.detail}` : ""}`}
                action={<button type="button" className="linkbtn" onClick={vs.refresh}>{t("refresh")}</button>}>
                {readErr.d}
              </Notice>
            )}
            {live && chainData && chainData.xlm === 0n && (
              <Notice tone="info" title={t("fund_t")} testid="fund-hint"
                action={<a className="btn btn-ghost btn-sm" href={LINKS.friendbot(wallet.address)} target="_blank" rel="noreferrer">{t("fund_cta")}</a>}>
                {t("fund_d")}
              </Notice>
            )}
          </div>

          <ContractIdBar t={t} className="app-cid" />

          <VaultStats t={t} state={statsState} mode={statsFromChain ? "live" : "preview"} source={statsSource} onRefresh={contractId ? vs.refresh : null} />
          <PositionCard t={t} pos={pos} mode={mode} connected={wallet.connected} />
          <ActionPanel t={t} tab={tab} setTab={setTab} base={base} limits={limits} chain={chain} mode={mode}
            submitLabel={submitLabel} blocked={Boolean(wrongNet && contractId)} onSubmit={onSubmit} address={live ? wallet.address : null} />
          {flash && <p className="flash" role="status" data-testid="preview-flash">{flash}</p>}

          {mode === "preview" && (
            <section className="panel app-card log" data-testid="preview-log">
              <div className="stats-h">
                <b>{t("log_title")}</b>
                <span className="sh-right"><span>{t("log_note")}</span>
                  <button type="button" className="linkbtn" onClick={resetPreview} data-testid="preview-reset">{t("log_reset")}</button></span>
              </div>
              {preview.log.length === 0 ? (
                <p className="log-empty">{t("log_empty")}</p>
              ) : (
                <ol className="log-list">
                  {preview.log.map((r) => (
                    <li key={r.n}>
                      <span className="mono n">#{r.n}</span>
                      <span className="mono">{r.kind}</span>
                      <span className="mono num">{xlm(r.assets)} XLM</span>
                      <span className="mono num">{fmtDec(r.shares, 10)} KRS</span>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}
        </div>
      </main>
      <TxDialog t={t} lang={lang} tx={tx} wallet={wallet} onClose={() => setTx(null)} onRetry={() => runLive(tx.kind, tx.amount)} />
    </div>
  );
}
