const CSS = `
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: none;
    border-radius: var(--radius-md);
    font-family: var(--font-sans);
    font-weight: var(--weight-medium);
    cursor: pointer;
    transition: all var(--transition-fast);
    white-space: nowrap;
    flex-shrink: 0;
  }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Sizes */
  .btn-sm  { font-size: var(--text-xs);  padding: 5px 10px; }
  .btn-md  { font-size: var(--text-sm);  padding: 8px 16px; }
  .btn-lg  { font-size: var(--text-base); padding: 10px 20px; }

  /* Variants */
  .btn-primary {
    background: var(--accent);
    color: #000;
  }
  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
    box-shadow: var(--shadow-accent);
  }
  .btn-secondary {
    background: var(--bg-elevated);
    color: var(--text-primary);
    border: 1px solid var(--border-default);
  }
  .btn-secondary:hover:not(:disabled) {
    background: var(--bg-overlay);
    border-color: var(--border-strong);
  }
  .btn-ghost {
    background: transparent;
    color: var(--text-secondary);
    border: 1px solid var(--border-subtle);
  }
  .btn-ghost:hover:not(:disabled) {
    background: var(--bg-overlay);
    color: var(--text-primary);
    border-color: var(--border-default);
  }
  .btn-danger {
    background: var(--danger-bg);
    color: var(--color-danger);
    border: 1px solid var(--danger-border);
  }
  .btn-danger:hover:not(:disabled) {
    background: rgba(239,68,68,0.15);
  }

  .btn-spinner {
    width: 12px; height: 12px;
    border: 2px solid rgba(0,0,0,0.25);
    border-top-color: currentColor;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }
  .btn-primary .btn-spinner {
    border-color: rgba(0,0,0,0.25);
    border-top-color: #000;
  }
`;

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  style = {},
}) {
  return (
    <>
      <style>{CSS}</style>
      <button
        type={type}
        className={`btn btn-${variant} btn-${size}`}
        disabled={disabled || loading}
        onClick={onClick}
        style={style}
      >
        {loading && <span className="btn-spinner" />}
        {children}
      </button>
    </>
  );
}
