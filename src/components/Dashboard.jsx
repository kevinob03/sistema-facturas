import { getInvoiceTotal, formatMoney } from '../utils/invoiceCalculator'
import { generateFinancialAudit } from '../utils/aiEngine'
import StatusBadge from './StatusBadge'

function Dashboard({ invoices, onNavigate, onFilterStatus }) {
  const totalInvoices = invoices.length
  const totalBilled = invoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0)
  const averageTotal = totalInvoices === 0 ? 0 : totalBilled / totalInvoices

  const now = new Date()
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const daysElapsed = Math.max(now.getDate(), 1)
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentMonthInvoices = invoices.filter(
    (invoice) => invoice.date.startsWith(currentMonthKey) && invoice.status !== 'anulada',
  )
  const currentMonthTotal = currentMonthInvoices.reduce(
    (sum, invoice) => sum + getInvoiceTotal(invoice),
    0,
  )
  const dailyAverage = currentMonthTotal / daysElapsed
  const projectedMonthTotal = dailyAverage * daysInMonth
  const currentMonthLabel = now.toLocaleDateString('es', { month: 'long', year: 'numeric' })

  const monthKeys = []
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('es', { month: 'short' }).replace('.', ''),
    })
  }

  const monthTotals = monthKeys.map((month) => ({ ...month, total: 0 }))
  invoices.forEach((invoice) => {
    const month = monthTotals.find((item) => item.key === invoice.date.slice(0, 7))
    if (month) month.total += getInvoiceTotal(invoice)
  })
  const maxMonth = Math.max(...monthTotals.map((month) => month.total), 1)

  const statuses = ['emitida', 'pagada', 'anulada']
  const statusData = statuses.map((status) => {
    const list = invoices.filter((invoice) => (invoice.status || 'emitida') === status)
    return {
      status,
      count: list.length,
      amount: list.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0),
    }
  })
  const maxCount = Math.max(...statusData.map((data) => data.count), 1)

  const clientTotals = {}
  invoices.forEach((invoice) => {
    clientTotals[invoice.client.name] =
      (clientTotals[invoice.client.name] || 0) + getInvoiceTotal(invoice)
  })
  const topClients = Object.entries(clientTotals)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
  const maxClient = Math.max(...topClients.map((client) => client.total), 1)

  const audit = generateFinancialAudit(invoices)

  return (
    <div className="dashboard">
      <div className="metrics">
        <div className="metric-card card">
          <span className="metric-label">Facturas</span>
          <span className="metric-value">{totalInvoices}</span>
        </div>
        <div className="metric-card card">
          <span className="metric-label">Total facturado</span>
          <span className="metric-value">{formatMoney(totalBilled)}</span>
        </div>
        <div className="metric-card card">
          <span className="metric-label">Promedio por factura</span>
          <span className="metric-value">{formatMoney(averageTotal)}</span>
        </div>
        <div className="metric-card card metric-card-projection">
          <span className="metric-label">Proyección al cierre</span>
          <span className="metric-value">{formatMoney(projectedMonthTotal)}</span>
          <span className="metric-foot">Basada en {daysElapsed} de {daysInMonth} días</span>
        </div>
      </div>

      {/* Diagnóstico Estratégico IA */}
      <section className="card ai-audit-card">
        <div className="ai-audit-head">
          <div className="ai-audit-title">
            <span className="ai-sparkle-icon">✨</span>
            <div>
              <h2 className="chart-title">Diagnóstico Financiero & Recomendaciones IA</h2>
              <p className="ai-audit-sub">Análisis en tiempo real de cartera, concentración y liquidez</p>
            </div>
          </div>
          <div className="ai-health-score-badge">
            <span className="ai-score-label">Salud de Cartera</span>
            <strong className="ai-score-number">{audit.healthScore}%</strong>
          </div>
        </div>

        <div className="ai-insights-grid">
          {audit.insights.map((ins, i) => (
            <div key={i} className={`ai-insight-item insight-${ins.level}`}>
              <div className="ai-insight-header">
                <span className="ai-insight-badge">
                  {ins.level === 'warning' ? '⚠️ Atención' : ins.level === 'success' ? '✓ Saludable' : 'ℹ️ Dato clave'}
                </span>
                <strong className="ai-insight-title">{ins.title}</strong>
              </div>
              <p className="ai-insight-desc">{ins.text}</p>
              {ins.action === 'Enviar recordatorios' && onFilterStatus && onNavigate && (
                <button
                  type="button"
                  className="ai-insight-action-btn"
                  onClick={() => {
                    onFilterStatus('emitida')
                    onNavigate('list')
                  }}
                >
                  ⚡ Ver facturas por cobrar
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="card projection-card">
        <div>
          <h2 className="chart-title">Proyección mensual</h2>
          <p className="projection-description">Estimación de cierre para {currentMonthLabel}</p>
        </div>
        <div className="projection-data">
          <div><span>Facturado vigente</span><strong>{formatMoney(currentMonthTotal)}</strong></div>
          <div><span>Promedio diario</span><strong>{formatMoney(dailyAverage)}</strong></div>
          <div><span>Facturas del mes</span><strong>{currentMonthInvoices.length}</strong></div>
        </div>
      </section>

      <div className="charts-grid">
        <section className="card chart-card full">
          <h2 className="chart-title">Facturado por mes</h2>
          <div className="bar-chart-vertical">
            {monthTotals.map((month) => (
              <div className="bar-col" key={month.key}>
                <span className="bar-value">{formatMoney(month.total)}</span>
                <div className="bar-canvas">
                  <div className="bar-fill" style={{ height: `${(month.total / maxMonth) * 100}%` }} />
                </div>
                <span className="bar-label">{month.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="card chart-card">
          <h2 className="chart-title">Distribución por estado</h2>
          {statusData.map((item) => (
            <div className="h-bar-row" key={item.status}>
              <span className="h-bar-label"><StatusBadge status={item.status} /></span>
              <div className="h-bar-track">
                <div className={`h-bar-fill status-fill-${item.status}`} style={{ width: `${(item.count / maxCount) * 100}%` }} />
              </div>
              <span className="h-bar-value">{item.count} · {formatMoney(item.amount)}</span>
            </div>
          ))}
        </section>

        <section className="card chart-card">
          <h2 className="chart-title">Top clientes</h2>
          {topClients.length === 0 ? <p className="empty-state">Sin datos</p> : topClients.map((client) => (
            <div className="h-bar-row" key={client.name}>
              <span className="h-bar-label">{client.name}</span>
              <div className="h-bar-track"><div className="h-bar-fill" style={{ width: `${(client.total / maxClient) * 100}%` }} /></div>
              <span className="h-bar-value">{formatMoney(client.total)}</span>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}

export default Dashboard