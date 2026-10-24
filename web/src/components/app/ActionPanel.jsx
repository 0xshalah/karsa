import { useEffect, useRef, useState } from "react";
import { parseUnits, toInput } from "../../lib/parse";
import { fmtDec, fmtInt, xlm } from "../../lib/format";
import { previewDeposit, previewMint, previewRedeem, previewWithdraw } from "../../lib/vault-math";

// kind -> input unit, output unit, rounding, preview fn
export const KINDS = {
  deposit: { inDec: 7, inUnit: "XLM", outDec: 10, outUnit: "KRS", round: "floor", label: "you_get", fn: "preview_deposit", local: previewDeposit,
    presets: [[5000000n, "0.5 XLM"], [10000000n, "1 XLM"], [100000000n, "10 XLM"]] },
  mint: { inDec: 10, inUnit: "KRS", outDec: 7, outUnit: "XLM", round: "ceil", label: "you_pay", fn: "preview_mint", local: previewMint,
    presets: [[3000000n, "3,000,000 raw"], [10000000000n, "1 KRS"]] },
  withdraw: { inDec: 7, inUnit: "XLM", outDec: 10, outUnit: "KRS", round: "ceil", label: "you_burn", fn: "preview_withdraw", local: previewWithdraw,
    presets: [[2000000n, "0.2 XLM"], [10000000n, "1 XLM"]] },
  redeem: { inDec: 10, inUnit: "KRS", outDec: 7, outUnit: "XLM", round: "floor", label: "you_get", fn: "preview_redeem", local: previewRedeem,
    presets: [[1000000n, "1,000,000 raw"], [10000000000n, "1 KRS"]] },
};
const ORDER = ["deposit", "mint", "withdraw", "redeem"];
const fmtOut = (v, dec) => (dec === 7 ? xlm(v) : fmtDec(v, 10));

const usePreview = (kind, amount, base, chain) => {
  const k = KINDS[kind];
  const local = amount !== null && amount > 0n ? k.local(amount, base.totalAssets, base.totalSupply, 3) : 0n;
  const [onchain, setOnchain] = useState({ key: "", value: null, error: null, loading: false });
  const key = `${chain?.contractId}|${kind}|${amount}`;
  const seq = useRef(0);
  useEffect(() => {
    if (!chain || amount === null || amount <= 0n) return undefined;
    const my = ++seq.current;
    setOnchain({ key, value: null, error: null, loading: true });
    const timer = setTimeout(async () => {
      try {
        const { previewOnChain } = await import("../../lib/stellar");
        const v = await previewOnChain(chain.contractId, kind, amount);
        if (my === seq.current) setOnchain({ key, value: v, error: null, loading: false });
      } catch (e) {
        if (my === seq.current) setOnchain({ key, value: null, error: { code: e.code, detail: e.detail }, loading: false });
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!chain) return { value: local, source: "local" };
  if (onchain.key !== key || onchain.loading) return { value: null, source: "wait" };
  if (onchain.error) return { value: null, source: "chain", error: onchain.error };
  return { value: onchain.value ?? 0n, source: "chain" };
};

const Form = ({ t, kind, value, setValue, base, limits, chain, mode, submitLabel, blocked, onSubmit, address }) => {
  const k = KINDS[kind];
  const amount = parseUnits(value, k.inDec);
  const invalid = value.trim() !== "" && amount === null;
  const pv = usePreview(kind, amount, base, chain);
  const maxIn = kind === "withdraw" ? limits?.maxWithdraw : kind === "redeem" ? limits?.maxRedeem : null;
  const overMax = maxIn !== null && maxIn !== undefined && amount !== null && amount > maxIn;
  const xlmNeeded = kind === "deposit" ? amount : kind === "mint" ? pv.value : null;
  const overXlm = mode === "live" && limits?.xlm !== null && limits?.xlm !== undefined && xlmNeeded !== null && xlmNeeded > limits.xlm;
  const zero = amount !== null && amount > 0n && pv.value === 0n;
  const ready = amount !== null && amount > 0n && !overMax && !overXlm && !zero && !pv.error && pv.value !== null && !blocked;
  const id = `amt-${kind}`;
  return (
    <div className="form" data-testid={`form-${kind}`}>
      <p className="form-d">{t(`d_${kind}`)}</p>
      <div className="af-top">
        <label htmlFor={id}>{t("amount")}</label>
        {maxIn !== null && maxIn !== undefined && (
          <button type="button" className="linkbtn" onClick={() => setValue(toInput(maxIn, k.inDec))} data-testid={`${id}-max`}>
            {t("max")} · {fmtOut(maxIn, k.inDec)} {k.inUnit}
          </button>
        )}
      </div>
      <div className={`af ${invalid || overMax || overXlm ? "bad" : ""}`}>
        <input id={id} data-testid={id} inputMode="decimal" autoComplete="off" placeholder="0.0" value={value}
          aria-invalid={invalid || overMax || overXlm ? "true" : undefined} aria-describedby={`${id}-hint`}
          onChange={(e) => setValue(e.target.value.replace(/[^\d.]/g, ""))} />
        <span className="af-unit">{k.inUnit}</span>
      </div>
      <div className="presets" aria-label={t("presets")}>
        {k.presets.map(([raw, label]) => (
          <button key={label} type="button" className="chip" onClick={() => setValue(toInput(raw, k.inDec))}>{label}</button>
        ))}
      </div>
      <div className="pv" data-testid={`pv-${kind}`} data-source={pv.source}>
        <div className="pv-main">
          <span className="pv-k">{t(k.label)}</span>
          <span className="pv-v" data-testid={`pv-${kind}-value`}>{pv.value === null ? "…" : fmtOut(pv.value, k.outDec)} <small>{k.outUnit}</small></span>
        </div>
        <div className="pv-meta">
          <span className={`rd-tag ${k.round}`}>{t(k.round)}</span>
          <span>{pv.source === "wait" ? t("src_wait") : t(pv.source === "chain" ? "src_chain" : "src_local", { fn: k.fn })}</span>
          {pv.value !== null && pv.value !== undefined && <span className="raw">= {fmtInt(pv.value)} {k.outDec === 7 ? "stroops" : "raw"}</span>}
        </div>
      </div>
      <p id={`${id}-hint`} className="hint" role="status">
        {invalid && t("invalid_amt", { d: k.inDec })}
        {overMax && t("over_max", { fn: kind === "withdraw" ? "max_withdraw" : "max_redeem", m: `${fmtOut(maxIn, k.inDec)} ${k.inUnit}` })}
        {overXlm && t("over_xlm")}
        {zero && t("zero_out")}
        {pv.error && <span className="bad">{pv.error.code}{pv.error.detail ? ` · ${pv.error.detail}` : ""}</span>}
      </p>
      <p className="args mono">{address ? t("args", { a: `${address.slice(0, 4)}…${address.slice(-4)}` }) : t("args_preview")}</p>
      <button type="button" className={`btn btn-primary btn-submit ${mode}`} disabled={!ready} onClick={() => onSubmit(kind, amount)} data-testid={`submit-${kind}`}>
        {submitLabel(kind)}
      </button>
    </div>
  );
};

export const ActionPanel = ({ t, tab, setTab, ...rest }) => {
  const [values, setValues] = useState({ deposit: "", mint: "", withdraw: "", redeem: "" });
  const refs = useRef({});
  const onKey = (e) => {
    const i = ORDER.indexOf(tab);
    let n = null;
    if (e.key === "ArrowRight") n = ORDER[(i + 1) % 4];
    if (e.key === "ArrowLeft") n = ORDER[(i + 3) % 4];
    if (e.key === "Home") n = ORDER[0];
    if (e.key === "End") n = ORDER[3];
    if (n) {
      e.preventDefault();
      setTab(n);
      refs.current[n]?.focus();
    }
  };
  return (
    <section className="panel app-card actions" id="actions" data-testid="action-panel">
      <div className="tabs" role="tablist" aria-label={t("tabs_aria")} onKeyDown={onKey}>
        {ORDER.map((k) => (
          <button key={k} ref={(el) => { refs.current[k] = el; }} role="tab" type="button" id={`tab-${k}`} aria-selected={tab === k}
            aria-controls={`panel-${k}`} tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)} data-testid={`tab-${k}`}>
            {t(`tab_${k}`)}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="tabpanel">
        <Form key={tab} t={t} kind={tab} value={values[tab]} setValue={(v) => setValues((s) => ({ ...s, [tab]: v }))} {...rest} />
      </div>
      <p className="rounding">{t("rounding")}</p>
    </section>
  );
};
