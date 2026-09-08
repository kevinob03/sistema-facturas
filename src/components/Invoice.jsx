import { useState } from 'react'
import {
  TAX_RATE,
  getSubtotal,
  getTax,
  getTotal,
  getLineTotal,
  formatMoney,
} from '../utils/invoiceCalculator'
import StatusBadge from './StatusBadge'
import AiReminderModal from './AiReminderModal'

function Invoice({ selectedInvoice, onShowToast }) {
  const [reminderOpen, setReminderOpen] = useState(false)
  if (!selectedInvoice) {
    return (
      <div className="invoice card">
        <h2 className="invoice-empty-title">Vista de factura</h2>
        <div className="empty-state">
          <p>Selecciona una factura para verla</p>
        </div>
      </div>
    )
  }

  const { issuer, client, invoiceNumber, date, items } = selectedInvoice
  const taxRate = Number.isFinite(Number(selectedInvoice.taxRate)) ? Number(selectedInvoice.taxRate) : TAX_RATE
  const subtotal = getSubtotal(items)
  const tax = getTax(subtotal, taxRate)
  const total = getTotal(subtotal, tax)
  const taxPercent = Math.round(taxRate * 100)

  return (
    <div className="invoice card">
      <div className="invoice-inner">
        <header className="invoice-header">
          <div className="invoice-issuer">
            <h2 className="issuer-name">{issuer.name}</h2>
            <p className="issuer-tax">RUC/NIT: {issuer.taxId}</p>
          </div>
          <div className="invoice-meta">
            <StatusBadge status={selectedInvoice.status} />
            <span className="invoice-tag">FACTURA</span>
            <p>
              Número: <strong>{invoiceNumber}</strong>
            </p>
            <p>
              Fecha: <strong>{date}</strong>
            </p>
          </div>
        </header>

        {selectedInvoice.status === 'emitida' && (
          <div className="invoice-ai-banner">
            <div className="invoice-ai-banner-text">
              <span className="ai-sparkle-icon">✨</span>
              <div>
                <strong>Factura pendiente de cobro</strong>
                <p>Genera un recordatorio de cobranza con IA para WhatsApp o Correo.</p>
              </div>
            </div>
            <button
              type="button"
              className="erp-btn erp-btn-primary invoice-ai-btn"
              onClick={() => setReminderOpen(true)}
            >
              ✨ Redactar recordatorio
            </button>
          </div>
        )}

        <section className="invoice-client">
          <h3>Facturado a</h3>
          <p className="client-name">{client.name}</p>
          {client.taxId && <p className="client-tax">Cédula: {client.taxId}</p>}
          <p className="client-contact">{client.contact}</p>
        </section>

        <div className="table-wrap">
          <table className="invoice-items-table">
            <thead>
              <tr>
                <th>Descripción</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th className="align-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{formatMoney(item.unitPrice)}</td>
                  <td className="align-right">{formatMoney(getLineTotal(item))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="invoice-summary">
          <div className="summary-row">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>Impuesto ({taxPercent}%)</span>
            <span>{formatMoney(tax)}</span>
          </div>
          <div className="summary-row summary-total">
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>
      <AiReminderModal
        invoice={selectedInvoice}
        isOpen={reminderOpen}
        onClose={() => setReminderOpen(false)}
        onCopySuccess={onShowToast}
      />
    </div>
  )
}

export default Invoice