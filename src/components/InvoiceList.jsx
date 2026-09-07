import { getInvoiceTotal, formatMoney } from '../utils/invoiceCalculator'
import StatusBadge from './StatusBadge'

function InvoiceList({
  invoices,
  allInvoices = invoices,
  selectedInvoice,
  onSelectInvoice,
  hasActiveFilters,
  sortKey,
  sortDir,
  onSort,
}) {
  const vigentes = allInvoices.filter((invoice) => invoice.status !== 'anulada')
  const promedioVigente = vigentes.length
    ? vigentes.reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0) / vigentes.length
    : 0
  const umbralAtipico = promedioVigente * 1.75
  const isAtypical = (invoice) =>
    vigentes.length >= 3 && invoice.status !== 'anulada' && getInvoiceTotal(invoice) >= umbralAtipico

  const renderSortHeader = (label, key, className = '') => {
    const active = sortKey === key
    return (
      <th className={`${className} sortable${active ? ' sort-active' : ''}`} onClick={() => onSort(key)}>
        {label}
        <span className="sort-arrow">{active ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
      </th>
    )
  }

  return (
    <div className="invoice-list card">
      <header className="card-header">
        <h2>Facturas registradas</h2>
        <span className="count-badge">{invoices.length} facturas</span>
      </header>

      {invoices.length === 0 ? (
        <div className="empty-state">
          <p>{hasActiveFilters ? 'No se encontraron facturas con estos filtros.' : 'No hay facturas registradas'}</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="invoice-table">
            <thead>
              <tr>
                {renderSortHeader('Número', 'invoiceNumber', 'cell-number')}
                {renderSortHeader('Cliente', 'client')}
                {renderSortHeader('Fecha', 'date')}
                {renderSortHeader('Total', 'total', 'align-right')}
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => {
                const atypical = isAtypical(invoice)
                return (
                  <tr
                    key={invoice.id}
                    className={`${selectedInvoice?.id === invoice.id ? 'selected ' : ''}${atypical ? 'invoice-atypical' : ''}`.trim()}
                    onClick={() => onSelectInvoice(invoice)}
                  >
                    <td className="cell-number">
                      <span>{invoice.invoiceNumber}</span>
                      {atypical && <span className="atypical-flag" title="Importe significativamente mayor al promedio vigente">Atípica</span>}
                    </td>
                    <td>{invoice.client.name}</td>
                    <td>{invoice.date}</td>
                    <td className="align-right cell-total">{formatMoney(getInvoiceTotal(invoice))}</td>
                    <td><StatusBadge status={invoice.status} /></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default InvoiceList