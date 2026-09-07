import { getInvoiceTotal, formatMoney } from '../utils/invoiceCalculator'
import StatusBadge from './StatusBadge'

function Dashboard({ invoices }) {
  const totalInvoices = invoices.length
  const totalBilled = invoices.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0)
  const averageTotal = totalInvoices === 0 ? 0 : totalBilled / totalInvoices

  const now = new Date()
  const monthKeys = []
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthKeys.push({
      key: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`,
      label: date.toLocaleDateString('es', { month: 'short' }).replace('.', ''),
    })
  }

  const monthTotals = monthKeys.map((month) => ({ ...month, total: 0 }))
  invoices.forEach((invoice) => {
    const month = monthTotals.find((m) => m.key === invoice.date.slice(0, 7))
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
      </div>

      <div className="charts-grid">
        <section className="card chart-card full">
          <h2 className="chart-title">Facturado por mes</h2>
          <div className="bar-chart-vertical">
            {monthTotals.map((month) => (
              <div className="bar-col" key={month.key}>
                <span className="bar-value">{formatMoney(month.total)}</span>
                <div className="bar-canvas">
                  <div
                    className="bar-fill"
                    style={{ height: `${(month.total / maxMonth) * 100}%` }}
                  />
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
              <span className="h-bar-label">
                <StatusBadge status={item.status} />
              </span>
              <div className="h-bar-track">
                <div
                  className={`h-bar-fill status-fill-${item.status}`}
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="h-bar-value">
                {item.count} · {formatMoney(item.amount)}
              </span>
            </div>
          ))}
        </section>

        <section className="card chart-card">
          <h2 className="chart-title">Top clientes</h2>
          {topClients.length === 0 ? (
            <p className="empty-state">Sin datos</p>
          ) : (
            topClients.map((client) => (
              <div className="h-bar-row" key={client.name}>
                <span className="h-bar-label">{client.name}</span>
                <div className="h-bar-track">
                  <div
                    className="h-bar-fill"
                    style={{ width: `${(client.total / maxClient) * 100}%` }}
                  />
                </div>
                <span className="h-bar-value">{formatMoney(client.total)}</span>
              </div>
            ))
          )}
        </section>
      </div>
    </div>
  )
}

export default Dashboard