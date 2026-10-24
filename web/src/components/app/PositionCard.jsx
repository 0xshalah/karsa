import { Layers } from "lucide-react";
import { fmtDec, xlm } from "../../lib/format";

const Row = ({ k, v, unit, testid }) => (
  <div className="pos-row">
    <span className="pk">{k}</span>
    <span className="pv" data-testid={testid}>{v} <small>{unit}</small></span>
  </div>
);

export const PositionCard = ({ t, pos, mode, connected, onFund }) => (
  <section className="panel app-card pos" data-testid="position-card">
    <div className="stats-h" style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <Layers size={16} color="var(--accent)" />
      <b>{mode === "live" ? t("pos_title") : t("pos_preview_title")}</b>
    </div>
    <div className="pos-body">
      {pos ? (
        <>
          <Row k={t("pos_shares")} v={fmtDec(pos.shares, 10)} unit="KRS" testid="pos-shares" />
          <Row k={t("pos_value")} v={xlm(pos.value)} unit="XLM" testid="pos-value" />
          <Row k={t("pos_mw")} v={xlm(pos.maxWithdraw)} unit="XLM" testid="pos-mw" />
          <Row k={t("pos_mr")} v={fmtDec(pos.maxRedeem, 10)} unit="KRS" testid="pos-mr" />
          {pos.xlm !== null && pos.xlm !== undefined && <Row k={t("pos_xlm")} v={xlm(pos.xlm)} unit="XLM" testid="pos-xlm" />}
        </>
      ) : (
        <p className="muted">…</p>
      )}
      <p className="pos-note">{mode === "live" ? "" : connected ? "" : t("pos_preview_note")}</p>
      {onFund}
    </div>
  </section>
);
