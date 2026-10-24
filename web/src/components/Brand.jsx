export const Mark = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
    <rect x="4.5" y="4.5" width="23" height="23" rx="4" fill="none" stroke="#10B981" strokeWidth="2.5" />
    <path d="M12 10v12M12 16l8-6M12 16l8 6" stroke="#F8FAFC" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
    <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
