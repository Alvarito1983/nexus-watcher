export function Skeleton({ width = '100%', height = 16, style = {} }) {
  return (
    <span
      className="skeleton"
      style={{ display: 'block', width, height, ...style }}
    />
  );
}

export function SkeletonRow({ cols = 3, gap = 12 }) {
  return (
    <div style={{ display: 'flex', gap, alignItems: 'center', padding: '14px 20px' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width={i === 0 ? '40%' : '20%'} height={14} />
      ))}
    </div>
  );
}

export function SkeletonCard({ rows = 3 }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '20px 24px',
      marginBottom: 8,
    }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={14} style={{ marginBottom: i < rows - 1 ? 10 : 0, width: i === 0 ? '60%' : '40%' }} />
      ))}
    </div>
  );
}
