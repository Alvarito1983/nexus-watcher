const CSS = `
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 20px;
    font-size: var(--text-xs);
    font-weight: var(--weight-medium);
    white-space: nowrap;
  }
  .badge-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .badge-uptodate {
    background: rgba(0,200,150,0.12);
    color: #00c896;
  }
  .badge-uptodate .badge-dot { background: #00c896; }

  .badge-outdated {
    background: rgba(240,165,0,0.12);
    color: #F0A500;
  }
  .badge-outdated .badge-dot {
    background: #F0A500;
    box-shadow: 0 0 6px rgba(240,165,0,0.5);
    animation: pulse 2s ease-in-out infinite;
  }

  .badge-updated {
    background: rgba(59,130,246,0.12);
    color: #3b82f6;
  }
  .badge-updated .badge-dot { background: #3b82f6; }

  .badge-unknown {
    background: rgba(85,85,106,0.15);
    color: #9090a8;
  }
  .badge-unknown .badge-dot { background: #55556a; }

  .badge-error {
    background: rgba(239,68,68,0.12);
    color: #ef4444;
  }
  .badge-error .badge-dot { background: #ef4444; }
`;

export default function Badge({ variant = 'unknown', dot = true, children }) {
  return (
    <>
      <style>{CSS}</style>
      <span className={`badge badge-${variant}`}>
        {dot && <span className="badge-dot" />}
        {children}
      </span>
    </>
  );
}
