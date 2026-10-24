import { useEffect, useRef } from "react";
import { LINKS } from "../../lib/config";
import { errCopy } from "../../lib/app-copy";
import { fmtDec, fmtInt, xlm } from "../../lib/format";
import { KINDS } from "./ActionPanel";

const STEPS = ["simulating", "signing", "pending", "done"];

export const TxDialog = ({ t, lang, tx, wallet, onClose, onRetry }) => {
  const box = useRef(null);
  const final = tx && (tx.step === "success" || tx.step === "failed");
  useEffect(() => {
    if (!tx) return undefined;
    box.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape" && final) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tx, final, onClose]);
  if (!tx) return null;
  const idx = final ? 3 : STEPS.indexOf(tx.step);
  const stateOf = (i) => {
    if (tx.step === "failed") return i < tx.failedAt ? "done" : i === tx.failedAt ? "error" : "idle";
    if (tx.step === "success") return "done";
    return i < idx ? "done" : i === idx ? "active" : "idle";
  };
  const k = KINDS[tx.kind];
  const resultText = tx.result !== null && tx.result !== undefined
    ? `${k.outDec === 7 ? xlm(tx.result) : fmtDec(tx.result, 10)} ${k.outUnit} (${fmtInt(tx.result)})`
    : "";
  const err = tx.error ? errCopy(tx.error.code, lang, { net: wallet.network || "?" }) : null;
  return (
    <div className="overlay" data-testid="tx-overlay">
      <div className="dialog panel" role="dialog" aria-modal="true" aria-labelledby="tx-title" tabIndex={-1} ref={box} data-testid="tx-dialog">
        <p className="label" id="tx-title">{t("tx_title", { a: t(`tab_${tx.kind}`) })}</p>
        <ol className="steps-tx">
          {STEPS.map((s, i) => {
            const st = stateOf(i);
            return (
              <li key={s} data-state={st} data-testid={`tx-step-${s}`}>
                <span className="sdot" aria-hidden="true">{st === "done" ? "✓" : st === "error" ? "×" : st === "active" ? "•" : ""}</span>
                <span>{s === "done" && final ? (tx.step === "success" ? t("tx_success", { l: fmtInt(tx.ledger || 0), r: resultText }) : t("tx_failed")) : t(`tx_${s}`)}</span>
              </li>
            );
          })}
        </ol>
        {err && (
          <div className="notice-box danger" role="alert" data-testid="tx-error" data-code={tx.error.code}>
            <div className="nb-body">
              <p className="nb-t">{err.t}</p>
              <p className="nb-d">{err.d}</p>
              {tx.error.detail && <p className="nb-code"><span>{t("code")}: {tx.error.detail}</span></p>}
            </div>
          </div>
        )}
        {tx.hash && (
          <a className="linkbtn tx-link" href={LINKS.tx(tx.hash)} target="_blank" rel="noreferrer" data-testid="tx-explorer">
            {t("tx_explorer")} · {tx.hash.slice(0, 12)}…
          </a>
        )}
        <div className="dlg-actions">
          {final ? (
            <>
              {tx.step === "failed" && <button type="button" className="btn btn-primary" onClick={onRetry}>{t("tx_retry")}</button>}
              <button type="button" className="btn btn-ghost" onClick={onClose} data-testid="tx-close">{t("tx_close")}</button>
            </>
          ) : (
            <p className="muted small">{t("tx_locked")}</p>
          )}
        </div>
      </div>
    </div>
  );
};
