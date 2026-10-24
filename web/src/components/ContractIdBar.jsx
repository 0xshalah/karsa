import { useEffect, useRef, useState } from "react";
import { LINKS, isValidContractId } from "../lib/config";
import { useContract } from "../lib/contract";

/**
 * Shows the configured contract ID with copy, explorer link and "Change Contract ID".
 * `t` supplies the strings: cid_k, cid_unset, cid_explorer, cid_edit, cid_change, cid_input_l,
 * cid_save, cid_clear, cid_bad, cid_ok, cid_cleared, cid_copy, cid_copied, cid_src_*.
 */
export const ContractIdBar = ({ t, className = "" }) => {
  const { id, source, setContractId } = useContract();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [msg, setMsg] = useState("");
  const [invalid, setInvalid] = useState(false);
  const [copied, setCopied] = useState(false);
  const input = useRef(null);
  const editBtn = useRef(null);

  useEffect(() => {
    if (editing) input.current?.focus();
  }, [editing]);

  const toggle = () => {
    setEditing((e) => !e);
    setValue(id || "");
    setInvalid(false);
    if (editing) setMsg("");
  };
  const close = () => {
    setEditing(false);
    editBtn.current?.focus();
  };
  const submit = (e) => {
    e.preventDefault();
    const v = value.trim().toUpperCase();
    if (!isValidContractId(v)) {
      setInvalid(true);
      setMsg(t("cid_bad", { n: v.length }));
      return;
    }
    setInvalid(false);
    setContractId(v);
    setMsg(t("cid_ok"));
    close();
  };
  const clear = () => {
    setContractId(null);
    setValue("");
    setInvalid(false);
    setMsg(t("cid_cleared"));
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setMsg(id);
    }
  };

  return (
    <div className={`cid ${editing ? "editing" : ""} ${className}`} data-testid="contract-bar">
      <span className="k">{t("cid_k")}</span>
      <span className={`v ${id ? "" : "unset"}`} data-testid="contract-id">{id || t("cid_unset")}</span>
      {id && <span className="src">{t(`cid_src_${source}`)}</span>}
      {id && (
        <button type="button" className="linkbtn" onClick={copy} data-testid="contract-copy">
          {copied ? t("cid_copied") : t("cid_copy")}
        </button>
      )}
      {id && (
        <a className="linkbtn" href={LINKS.explorer(id)} target="_blank" rel="noreferrer" data-testid="contract-explorer">
          {t("cid_explorer")}
        </a>
      )}
      <button ref={editBtn} type="button" className="linkbtn" aria-expanded={editing} aria-controls="cidForm" onClick={toggle} data-testid="contract-change">
        {t(id ? "cid_change" : "cid_edit")}
      </button>
      <form className="cid-form" id="cidForm" noValidate onSubmit={submit}>
        <label className="sr" htmlFor="cidInput">{t("cid_input_l")}</label>
        <input
          ref={input}
          id="cidInput"
          data-testid="contract-input"
          autoComplete="off"
          spellCheck="false"
          maxLength={56}
          placeholder="C…"
          aria-describedby="cidMsg"
          aria-invalid={invalid ? "true" : undefined}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Escape" && close()}
        />
        <button type="submit" className="btn btn-ghost btn-sm" data-testid="contract-save">{t("cid_save")}</button>
        {source === "local" && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={clear} data-testid="contract-clear">{t("cid_clear")}</button>
        )}
      </form>
      <p className="cid-msg" id="cidMsg" role="status" data-testid="contract-msg">{msg}</p>
    </div>
  );
};
