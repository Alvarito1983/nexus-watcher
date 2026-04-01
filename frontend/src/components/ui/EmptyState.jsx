const CSS = `
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 64px 24px;
    text-align: center;
    color: var(--text-muted);
  }
  .empty-state-icon {
    margin-bottom: 16px;
    opacity: 0.4;
  }
  .empty-state-title {
    font-size: var(--text-base);
    font-weight: var(--weight-medium);
    color: var(--text-secondary);
    margin-bottom: 6px;
  }
  .empty-state-desc {
    font-size: var(--text-sm);
    color: var(--text-muted);
    max-width: 300px;
    line-height: 1.6;
  }
  .empty-state-action {
    margin-top: 20px;
  }
`;

export default function EmptyState({ icon, title, description, action }) {
  return (
    <>
      <style>{CSS}</style>
      <div className="empty-state animate-in">
        {icon && <div className="empty-state-icon">{icon}</div>}
        <div className="empty-state-title">{title}</div>
        {description && <div className="empty-state-desc">{description}</div>}
        {action && <div className="empty-state-action">{action}</div>}
      </div>
    </>
  );
}
