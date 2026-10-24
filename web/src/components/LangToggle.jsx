import { useLang } from "../lib/i18n";

export const LangToggle = ({ label }) => {
  const { lang, setLang } = useLang();
  return (
    <div className="lang" role="group" aria-label={label}>
      {["en", "id"].map((l) => (
        <button key={l} type="button" data-lang={l} aria-pressed={lang === l} onClick={() => setLang(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
};
