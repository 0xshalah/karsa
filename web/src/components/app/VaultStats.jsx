import { RotateCw, ShieldCheck, Activity } from "lucide-react";
import { anchor, sharePriceScaled } from "../../lib/vault-math";
import { fmtDec, fmtInt, xlm } from "../../lib/format";

export const VaultStats = ({ t, state, mode, source, onRefresh }) => {
  const { vA, vS } = anchor(3);
  const loading = !state;
  const ta = state?.totalAssets ?? 0n;
  const ts = state?.totalSupply ?? 0n;
  const price = sharePriceScaled(ta, ts, 3);
  const dash = "…";
  return (
    <section className="panel app-card" data-testid="vault-stats" data-mode={mode}>
      <div className="stats-h">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Activity size={16} color="var(--accent)" />
          <b>{t("st_title")}</b>
        </div>
        <span className="sh-right">
          <span className={`mode-tag ${mode}`} data-testid="mode-tag">{mode === "live" ? t("mode_live") : t("mode_preview")}</span>
          <span data-testid="stats-source">{source}</span>
          {onRefresh && (
            <button type="button" className="linkbtn" onClick={onRefresh} data-testid="stats-refresh" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
              <RotateCw size={12} />
              <span>{t("refresh")}</span>
            </button>
          )}
        </span>
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-k">{t("s_assets")}</div>
          <div className="stat-v" data-testid="vs-assets">{loading ? dash : xlm(ta)} <small>XLM</small></div>
          <div className="stat-r">{loading ? "" : t("stroops", { n: fmtInt(ta) })}</div>
        </div>
        <div className="stat">
          <div className="stat-k">{t("s_supply")}</div>
          <div className="stat-v" data-testid="vs-supply">{loading ? dash : fmtDec(ts, 10)} <small>KRS</small></div>
          <div className="stat-r">{loading ? "" : t("raw", { n: fmtInt(ts) })}</div>
        </div>
        <div className="stat">
          <div className="stat-k">{t("s_price")}</div>
          <div className="stat-v" data-testid="vs-price">{loading ? dash : xlm(price)} <small>{t("s_price_u")}</small></div>
          <div className="stat-r">{t("s_price_sub")}</div>
        </div>
        <div className="stat">
          <div className="stat-k">decimals</div>
          <div className="stat-v">10 <small>7 + offset 3</small></div>
        </div>
        <div className="stat anchor">
          <div className="stat-k" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <ShieldCheck size={14} color="var(--anchor)" />
            <span>{t("s_anchor")}</span>
          </div>
          <div className="stat-v">100 XLM · 100 KRS</div>
          <div className="stat-r">v_assets = {fmtInt(vA)} · v_shares = {fmtInt(vS)}</div>
          <div className="stat-r anchor-d">{t("s_anchor_d")}</div>
        </div>
      </div>
    </section>
  );
};
