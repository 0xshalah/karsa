import { AlertTriangle, CheckCircle2, Info, AlertCircle } from "lucide-react";

export const Notice = ({ tone = "warn", title, children, action, testid, code }) => {
  const Icon = tone === "ok" ? CheckCircle2 : tone === "danger" ? AlertCircle : tone === "info" ? Info : AlertTriangle;
  const iconColor = tone === "ok" ? "var(--verified)" : tone === "danger" ? "var(--danger)" : tone === "info" ? "var(--anchor)" : "#FBBF24";

  return (
    <div className={`notice-box ${tone}`} role={tone === "danger" ? "alert" : "status"} data-testid={testid} data-code={code}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flex: "1 1 280px", minWidth: 0 }}>
        <Icon size={18} color={iconColor} style={{ flexShrink: 0, marginTop: 2 }} />
        <div className="nb-body" style={{ flex: 1, minWidth: 0 }}>
          <p className="nb-t">{title}</p>
          {children && <p className="nb-d">{children}</p>}
          {code && <p className="nb-code"><span>{code}</span></p>}
        </div>
      </div>
      {action}
    </div>
  );
};
