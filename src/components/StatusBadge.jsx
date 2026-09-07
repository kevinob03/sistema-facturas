const STATUS_LABELS = {
  emitida: 'Emitida',
  pagada: 'Pagada',
  anulada: 'Anulada',
}

function StatusBadge({ status }) {
  const label = STATUS_LABELS[status] || status
  return <span className={`status-badge status-${status}`}>{label}</span>
}

export default StatusBadge