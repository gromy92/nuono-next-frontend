export function OfficialWarehouseMetric({
  label,
  value,
  tone,
  active,
  onClick
}: {
  label: string
  value: number
  tone?: 'green' | 'blue' | 'red' | 'amber'
  active?: boolean
  onClick?: () => void
}) {
  const className = [
    'official-warehouse-metric',
    tone ? `official-warehouse-metric-${tone}` : '',
    active ? 'official-warehouse-metric-active' : '',
    onClick ? 'official-warehouse-metric-clickable' : ''
  ].filter(Boolean).join(' ')
  const content = (
    <>
      <div className="official-warehouse-metric-value">{Number(value || 0).toLocaleString()}</div>
      <div className="official-warehouse-metric-label">{label}</div>
    </>
  )
  if (onClick) {
    return (
      <button className={className} type="button" aria-pressed={Boolean(active)} onClick={onClick}>
        {content}
      </button>
    )
  }
  return <div className={className}>{content}</div>
}
