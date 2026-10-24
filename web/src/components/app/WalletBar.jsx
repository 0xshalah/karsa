import { useState } from "react";
import { Link } from "react-router-dom";
import { Mark } from "../Brand";
import { LangToggle } from "../LangToggle";
import { shortAddr } from "../../lib/format";
import { withLang } from "../../lib/i18n";

export const WalletBar = ({ t, lang, wallet }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard blocked */ }
  };
  return (
    <header className="nav scrolled app-nav" data-testid="app-header">
      <div className="wrap app-wrap">
        <div className="an-left">
          <Link className="brand" to={withLang("/", lang)} aria-label="Karsa Vault"><Mark /><b className="hide-xs">Karsa Vault</b></Link>
          <span className="tn">Testnet</span>
          <Link className="lk-back hide-xs" to={withLang("/", lang)} data-testid="app-back">← {t("back")}</Link>
        </div>
        <div className="an-right">
          <LangToggle label={t("lang_aria")} />
          {wallet.connected ? (
            <div className={`addr ${wallet.testnet ? "" : "wrong"}`} data-testid="wallet-connected">
              <span className="dot" aria-hidden="true" />
              <span className="mono" title={wallet.address}>{shortAddr(wallet.address)}</span>
              <span className="net">{wallet.testnet ? t("net_testnet") : wallet.network}</span>
              <button type="button" className="linkbtn" onClick={copy} aria-label={t("copy_addr")}>{copied ? t("copied") : t("copy_addr").split(" ")[0]}</button>
              <button type="button" className="linkbtn" onClick={wallet.disconnect} data-testid="wallet-disconnect">{t("disconnect")}</button>
            </div>
          ) : (
            <button type="button" className="btn btn-primary btn-wallet" onClick={wallet.connect} disabled={wallet.status === "connecting"} data-testid="wallet-connect">
              {wallet.status === "connecting" ? t("connecting") : <><span className="hide-xs">{t("connect")}</span><span className="show-xs">{t("connect_short")}</span></>}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
