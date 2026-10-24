import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { S } from "../lib/copy";
import { makeT, useLang, withLang } from "../lib/i18n";
import { LINKS } from "../lib/config";
import { useContract } from "../lib/contract";
import { useRpcHealth, useVaultState } from "../hooks/useVaultState";
import { anchor, donationLab, sharePriceScaled } from "../lib/vault-math";
import { fmtDec, fmtInt, fmtPct, pctWidth, xlm } from "../lib/format";
import { Arrow, Mark } from "../components/Brand";
import { Building2, Layers, ShieldCheck, Code } from "lucide-react";
import { LangToggle } from "../components/LangToggle";
import { ContractIdBar } from "../components/ContractIdBar";

const REPO = "https://github.com/0xshalah/karsa";
const trimX = (s) => xlm(s).replace(/0+$/, "").replace(/\.$/, "");

const useReveal = (dep) => {
  useEffect(() => {
    const els = document.querySelectorAll(".rv:not(.in)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return undefined;
    }
    const io = new IntersectionObserver(
      (ents) => ents.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      }),
      { threshold: 0.12 },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [dep]);
};

const Nav = ({ t, lang }) => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const jump = (e, id) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <header className={`nav ${scrolled ? "scrolled" : ""}`} id="nav">
      <div className="wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <a className="brand" href="#top" aria-label="Karsa Vault" onClick={(e) => jump(e, "top")}>
            <Mark />
            <b>Karsa Vault</b>
          </a>
          <span className="tn hide-xs">Testnet</span>
        </div>
        <nav aria-label={t("nav_aria")}>
          <a className="lk" href={LINKS.sep56} target="_blank" rel="noreferrer">{t("nav_docs")}</a>
          <a className="lk" href="#security" onClick={(e) => jump(e, "security")}>{t("nav_sec")}</a>
          <LangToggle label={t("lang_aria")} />
          <Link className="btn btn-ghost hide-xs" to={withLang("/app", lang)} data-testid="nav-launch">{t("nav_cta")}</Link>
        </nav>
      </div>
    </header>
  );
};

const StatsPanel = ({ t, lang }) => {
  const { id } = useContract();
  const vs = useVaultState(id);
  const { net } = useRpcHealth();
  const live = vs.status === "live" ? vs.data : null;
  const ta = live ? live.totalAssets : 0n;
  const ts = live ? live.totalSupply : 0n;
  const price = sharePriceScaled(ta, ts, 3);
  const pending = vs.status === "loading";
  const dash = "…";

  return (
    <div className="panel hero-stats" id="stats" data-testid="landing-stats" data-state={vs.status}>
      <div className="stats-h">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="dot ok">●</span>
          <b>{t("st_title")}</b>
        </div>
        <span className="hero-status-tag">
          {net.state === "live" ? `Stellar Testnet · #${fmtInt(live?.ledger || net.ledger || 0)}` : "Stellar Testnet"}
        </span>
      </div>
      <div className="stat-grid hero-stat-grid">
        <div className="stat">
          <div className="stat-k">{t("st_assets")}</div>
          <div className="stat-v" data-testid="stat-assets">{pending ? dash : xlm(ta)} <small>XLM</small></div>
        </div>
        <div className="stat">
          <div className="stat-k">{t("st_supply")}</div>
          <div className="stat-v">{pending ? dash : fmtDec(ts, 10)} <small>KRS</small></div>
        </div>
        <div className="stat">
          <div className="stat-k">{t("st_price")}</div>
          <div className="stat-v" data-testid="stat-price">{pending ? dash : xlm(price)} <small>{t("st_price_u")}</small></div>
          <div className="stat-r">{t("st_price_sub")}</div>
        </div>
        <div className="stat">
          <div className="stat-k">{t("st_anchor")}</div>
          <div className="stat-v" style={{ fontSize: "18px" }}>100 XLM <small>Virtual</small></div>
          <div className="stat-r">10^9 stroops · 10^12 shares</div>
        </div>
      </div>
      <div className="hero-stats-footer">
        <div className="hsf-row">
          <span className="hsf-shield" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ShieldCheck size={14} color="var(--verified)" /><span>Anti-Inflation Anchor Protected</span></span>
          <Link className="hsf-link" to={withLang("/app", lang)}>{t("nav_cta")} →</Link>
        </div>
      </div>
    </div>
  );
};

const Hero = ({ t, lang }) => (
  <section className="hero" id="top">
    <div className="glow" aria-hidden="true" />
    <div className="wrap">
      <p className="notice" role="note" data-testid="banner">{t("notice")}</p>
      <div className="hero-grid">
        <div>
          <p className="label">{t("eyebrow")}</p>
          <h1>{t("h1").map((l) => <span key={l}>{l}</span>)}</h1>
          <p className="sub">{t("sub")}</p>
          <div className="cta">
            <Link className="btn btn-primary" to={withLang("/app", lang)} data-testid="hero-open">
              <span>{t("cta1")}</span><Arrow />
            </Link>
            <a className="btn btn-ghost" href="#infrastructure">{t("cta2")}</a>
          </div>
        </div>
        <StatsPanel t={t} lang={lang} />
      </div>
    </div>
  </section>
);

const Marquee = ({ t }) => {
  const mq = t("marquee");
  const row = mq.map((m) => (
    <span key={m} style={{ display: "contents" }}><span>{m}</span><i>·</i></span>
  ));
  return (
    <>
      <div className="marquee" aria-hidden="true"><div className="track"><div>{row}</div><div>{row}</div></div></div>
      <p className="sr">{t("marquee_sr") + mq.join(", ")}</p>
    </>
  );
};
const UseCases = ({ t }) => (
  <section className="s" id="infrastructure">
    <div className="wrap">
      <div className="shead rv">
        <p className="label">{t("b2b_l")}</p>
        <div>
          <h2>{t("b2b_t")}</h2>
          <p className="lead">{t("b2b_lead")}</p>
        </div>
      </div>
      <div className="b2b-grid">
        <div className="panel b2b-card rv">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="b2b-k" style={{ margin: 0 }}>{t("b2b_c1_k")}</div>
            <Building2 size={20} color="var(--accent)" />
          </div>
          <h3>{t("b2b_c1_t")}</h3>
          <p>{t("b2b_c1_d")}</p>
          <div className="b2b-badge">{t("b2b_c1_b")}</div>
        </div>
        <div className="panel b2b-card rv">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="b2b-k" style={{ margin: 0 }}>{t("b2b_c2_k")}</div>
            <Layers size={20} color="var(--accent)" />
          </div>
          <h3>{t("b2b_c2_t")}</h3>
          <p>{t("b2b_c2_d")}</p>
          <div className="b2b-badge">{t("b2b_c2_b")}</div>
        </div>
        <div className="panel b2b-card rv">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div className="b2b-k" style={{ margin: 0 }}>{t("b2b_c3_k")}</div>
            <ShieldCheck size={20} color="var(--accent)" />
          </div>
          <h3>{t("b2b_c3_t")}</h3>
          <p>{t("b2b_c3_d")}</p>
          <div className="b2b-badge">{t("b2b_c3_b")}</div>
        </div>
      </div>
      <ContractIdBar t={t} className="b2b-cid" />
      <div className="panel dev-quickstart rv">
        <div className="dq-head">
          <div className="dq-title">
            <Code size={15} color="var(--verified)" />
            <b>{t("dev_t")}</b>
          </div>
          <span className="mono dq-spec">soroban-sdk = "26.1.1" · SEP-0056 v0.1.2</span>
        </div>
        <pre className="dq-code"><code>{`// 1. Initialize vault client in your Soroban smart contract or service
let vault = KarsaVaultClient::new(&env, &vault_address);

// 2. Execute deposit with protocol-level anti-inflation anchor protection
let shares = vault.deposit(&assets, &receiver, &from, &operator);

// 3. Preview exact asset return (strictly rounded floor in vault favor)
let assets_out = vault.preview_redeem(&shares);`}</code></pre>
      </div>
    </div>
  </section>
);


const How = ({ t }) => (
  <section className="s" id="how">
    <div className="wrap">
      <div className="shead rv"><p className="label">{t("how_l")}</p><h2>{t("how_t")}</h2></div>
      <ol className="steps">
        {[1, 2, 3].map((i) => (
          <li key={i} className="rv l">
            <div className="n"><b>0{i}</b><span>{t(`how${i}_k`)}</span></div>
            <div><h3>{t(`how${i}_t`)}</h3><p>{t(`how${i}_d`)}</p><code className="formula">{t(`how${i}_f`)}</code></div>
          </li>
        ))}
      </ol>
    </div>
  </section>
);

const Side = ({ t, cls, title, tag, n, m }) => (
  <div className={`res ${cls}`}>
    <div className="res-h"><h3>{title}</h3><span className="tag">{tag}</span></div>
    <div className="big" data-testid={`lab-${cls}`}>{t("shares_u", { n: fmtInt(n) })}</div>
    <div className="of">{t("of_exp", { e: fmtInt(m.expected) })}</div>
    <div className="bar" aria-hidden="true"><i style={{ width: `${pctWidth(n, m.expected)}%` }} /></div>
    <div className="res-f"><span>{t("kept", { p: fmtPct(n, m.expected) })}</span></div>
  </div>
);

const Lab = ({ t }) => {
  const [D, setD] = useState(50000000);
  const [V, setV] = useState(5000000);
  const [O, setO] = useState(3);
  const m = useMemo(() => donationLab(BigInt(D), BigInt(V), O), [D, V, O]);
  const fields = [
    ["inD", t("in_d"), D, setD, 1000000, 500000000, 1000000, ["0.1 XLM", "50 XLM"], <>{t("stroops", { n: fmtInt(D) })}<small>{trimX(BigInt(D))} XLM</small></>],
    ["inV", t("in_v"), V, setV, 1000000, 100000000, 1000000, ["0.1 XLM", "10 XLM"], <>{t("stroops", { n: fmtInt(V) })}<small>{trimX(BigInt(V))} XLM</small></>],
    ["inO", t("in_o"), O, setO, 0, 6, 1, ["0", "6"], <>{O}<small>{t("offset_v", { o: O, s: fmtInt(m.off) })}</small></>],
  ];
  return (
    <section className="s" id="lab" style={{ paddingTop: 32 }}>
      <div className="wrap">
        <div className="shead rv"><p className="label">{t("lab_l")}</p>
          <div><h2>{t("lab_t")}</h2><p className="lead">{t("lab_lead")}</p></div></div>
        <div className="panel lab rv">
          <div className="inputs">
            {fields.map(([id, label, val, set, min, max, step, ends, out]) => (
              <div className="field" key={id}>
                <label htmlFor={id}><span>{label}</span><output htmlFor={id}>{out}</output></label>
                <input type="range" id={id} min={min} max={max} step={step} value={val} onChange={(e) => set(Number(e.target.value))} />
                <div className="range-ends"><span>{ends[0]}</span><span>{ends[1]}</span></div>
              </div>
            ))}
          </div>
          <div className="results" aria-live="polite">
            <Side t={t} cls="naive" title={t("naive_t")} tag={t("naive_tag")} n={m.naive} m={m} />
            <Side t={t} cls="karsa" title="Karsa Vault" tag={t("karsa_tag")} n={m.karsa} m={m} />
          </div>
          <p className="verdict">{t("v_main", { d: trimX(BigInt(D)), np: fmtPct(m.naive, m.expected), kp: fmtPct(m.karsa, m.expected) })}</p>
          <p className="lab-note">{t("lab_note", { a: fmtPct(m.vS, m.vS + m.karsa) })}</p>
          <details className="fx">
            <summary>{t("fx_s")}</summary>
            <div className="fx-body">
              <div><span className="m">{t("fx_naive")}:</span> shares = floor(V × (0 + 10^{O}) / (0 + D + 1))<br />= floor({fmtInt(V)} × {fmtInt(m.off)} / {fmtInt(BigInt(D) + 1n)}) = {fmtInt(m.naive)}</div>
              <div><span className="m">Karsa:</span> shares = floor(V × (0 + v_shares) / (0 + D + v_assets))<br /><span className="c">v_assets = {fmtInt(m.vA)} · v_shares = v_assets × 10^{O} = {fmtInt(m.vS)}</span><br />= floor({fmtInt(V)} × {fmtInt(m.vS)} / {fmtInt(BigInt(D) + m.vA)}) = {fmtInt(m.karsa)}</div>
            </div>
          </details>
        </div>
      </div>
    </section>
  );
};

const FNS = [
  ["acc", "query_asset", "", "Address", "exact", "a_none"],
  ["acc", "total_assets", "", "i128", "exact", "a_none"],
  ["acc", "total_supply", "", "i128", "exact", "a_none"],
  ["acc", "decimals", "", "u32 = 10", "exact", "a_none"],
  ["conv", "convert_to_shares", "assets", "i128", "floor", "a_none"],
  ["conv", "convert_to_assets", "shares", "i128", "floor", "a_none"],
  ["conv", "preview_deposit", "assets", "i128", "floor", "a_none"],
  ["conv", "preview_mint", "shares", "i128", "ceil", "a_none"],
  ["conv", "preview_withdraw", "assets", "i128", "ceil", "a_none"],
  ["conv", "preview_redeem", "shares", "i128", "floor", "a_none"],
  ["lim", "max_deposit", "receiver", "i128::MAX", "exact", "a_none"],
  ["lim", "max_mint", "receiver", "i128::MAX", "exact", "a_none"],
  ["lim", "max_withdraw", "owner", "i128", "floor", "a_none"],
  ["lim", "max_redeem", "owner", "i128", "exact", "a_none"],
  ["mut", "deposit", "assets, receiver, from, operator", "i128 shares", "floor", "a_dep"],
  ["mut", "mint", "shares, receiver, from, operator", "i128 assets", "ceil", "a_dep"],
  ["mut", "withdraw", "assets, receiver, owner, operator", "i128 shares", "ceil", "a_wd"],
  ["mut", "redeem", "shares, receiver, owner, operator", "i128 assets", "floor", "a_wd"],
];

const Mechanics = ({ t }) => {
  const rows = [];
  let g = null;
  for (const [grp, n, args, ret, rd, auth] of FNS) {
    if (grp !== g) {
      g = grp;
      rows.push(<tr className="grp" key={`g-${grp}`}><td colSpan={4}>{t(`g_${grp}`)}<span>{t(`g_${grp}_d`)}</span></td></tr>);
    }
    rows.push(
      <tr key={n}>
        <td data-h={t("th_fn")}><span className="fn">{n}<span className="fn-args">({args})</span></span></td>
        <td className="mono" data-h={t("th_ret")}>{ret}</td>
        <td data-h={t("th_rd")}><span className={`rd ${rd}`}>{t(`r_${rd}`).toUpperCase()}</span></td>
        <td data-h={t("th_auth")}>{t(auth)}</td>
      </tr>,
    );
  }
  return (
    <section className="s" id="mechanics">
      <div className="wrap">
        <div className="shead rv"><p className="label">{t("mech_l")}</p>
          <div><h2>{t("mech_t")}</h2><p className="lead">{t("mech_lead")}</p></div></div>
        <div className="tbl rv">
          <table>
            <caption className="sr">{t("mech_cap")}</caption>
            <thead><tr><th scope="col">{t("th_fn")}</th><th scope="col">{t("th_ret")}</th><th scope="col">{t("th_rd")}</th><th scope="col">{t("th_auth")}</th></tr></thead>
            <tbody>{rows}</tbody>
          </table>
        </div>
        <p className="tbl-note rv">{t("mech_note")}</p>
      </div>
    </section>
  );
};

const Security = ({ t }) => {
  const { id } = useContract();
  return (
    <section className="s" id="security">
      <div className="wrap">
        <div className="shead rv"><p className="label">{t("sec_l")}</p><h2>{t("sec_t")}</h2></div>
        <div className="split">
          <div className="panel list-panel rv l">
            <div className="lp-h"><h3>{t("sec_did")}</h3><span className="cnt ok">05</span></div>
            <p className="lp-sub">{t("sec_did_sub")}</p>
            <ul className="grs">{[1, 2, 3, 4, 5].map((i) => <li key={i}><b>{t(`gr${i}k`)}</b>{t(`gr${i}`)}</li>)}</ul>
          </div>
          <div className="panel list-panel rv r">
            <div className="lp-h"><h3>{t("sec_not")}</h3><span className="cnt bad">05</span></div>
            <p className="lp-sub">{t("sec_not_sub")}</p>
            <ul className="lims">{[1, 2, 3, 4, 5].map((i) => <li key={i}>{t(i === 2 && id ? "lim2_set" : `lim${i}`)}</li>)}</ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const Faq = ({ t }) => (
  <section className="s" id="faq" style={{ paddingTop: 32 }}>
    <div className="wrap">
      <div className="shead rv"><p className="label">{t("faq_l")}</p><h2>{t("faq_t")}</h2></div>
      <div className="faq rv">
        {[1, 2, 3, 4, 5].map((i) => (
          <details key={i}><summary><span className="q-n">0{i}</span><span className="q-t">{t(`faq${i}_q`)}</span></summary><p className="a">{t(`faq${i}_a`)}</p></details>
        ))}
      </div>
    </div>
  </section>
);

const Footer = ({ t }) => {
  const { id } = useContract();
  return (
    <footer>
      <div className="wrap">
        <div className="f-top">
          <div className="f-brand">
            <span className="brand"><Mark size={22} /><b>Karsa Vault · KRS</b></span>
            <p className="bad">{t("f_notice")}</p>
          </div>
          <dl className="kv">
            <div><dt>{t("f_contract")}</dt><dd className={id ? "" : "unset"}>{id || t("cid_unset")}</dd></div>
            <div><dt>{t("f_asset")}</dt><dd>{t("f_asset_v")}</dd></div>
            <div><dt>{t("f_ctor")}</dt><dd>(name: "Karsa Vault", symbol: "KRS", asset, decimals_offset: 3)</dd></div>
          </dl>
        </div>
        <ul className="f-links">
          <li><a href={REPO} target="_blank" rel="noreferrer">{t("f_repo")} · GitHub</a></li>
          <li><a href="https://x.com/karsavault" target="_blank" rel="noreferrer">X @karsavault</a></li>
          <li><a href={id ? LINKS.explorer(id) : LINKS.explorerRoot} target="_blank" rel="noreferrer">{t("f_explorer")}</a></li>
          <li><a href={LINKS.sep56} target="_blank" rel="noreferrer">{t("f_spec")}</a></li>
        </ul>
        <div className="f-bot"><span>SEP-0056 v0.1.2 + SEP-0041 · Soroban testnet</span><span>{t("f_sim")}</span></div>
      </div>
    </footer>
  );
};

export default function Landing() {
  const { lang } = useLang();
  const t = useMemo(() => makeT(S, lang), [lang]);
  useReveal(lang);
  useEffect(() => {
    document.title = lang === "id" ? "Karsa Vault: vault SEP-0056 di Stellar testnet" : "Karsa Vault: SEP-0056 vault on Stellar testnet";
  }, [lang]);
  return (
    <div className="page" data-testid="landing">
      <a className="skip" href="#main" onClick={(e) => { e.preventDefault(); const m = document.getElementById("main"); m.setAttribute("tabindex", "-1"); m.focus(); }}>{t("skip")}</a>
      <Nav t={t} lang={lang} />
      <main id="main">
        <Hero t={t} lang={lang} />
        <Marquee t={t} />
        <UseCases t={t} />
        <How t={t} />
        <Lab t={t} />
        <Mechanics t={t} />
        <Security t={t} />
        <Faq t={t} />
      </main>
      <Footer t={t} />
    </div>
  );
}
