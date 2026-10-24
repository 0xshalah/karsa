export const Notice = ({ tone = "warn", title, children, action, testid, code }) => (
  <div className={`notice-box ${tone}`} role={tone === "danger" ? "alert" : "status"} data-testid={testid} data-code={code}>
    <div className="nb-body">
      <p className="nb-t">{title}</p>
      {children && <p className="nb-d">{children}</p>}
      {code && <p className="nb-code"><span>{code}</span></p>}
    </div>
    {action}
  </div>
);
