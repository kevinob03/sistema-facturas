import { useState } from 'react'
import { generatePaymentReminder } from '../utils/aiEngine'

function AiReminderModal({ invoice, isOpen, onClose, onCopySuccess }) {
  const [tone, setTone] = useState('amable')
  const [copied, setCopied] = useState(false)

  if (!isOpen || !invoice) return null

  const reminder = generatePaymentReminder({ invoice, tone })

  const handleCopy = () => {
    navigator.clipboard.writeText(`${reminder.subject}\n\n${reminder.message}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    if (onCopySuccess) onCopySuccess('Mensaje copiado al portapapeles')
  }

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`*${reminder.subject}*\n\n${reminder.message}`)
    const phone = invoice.client?.contact?.replace(/[^0-9]/g, '') || ''
    const url = phone.length >= 8 ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`
    window.open(url, '_blank')
  }

  const handleEmail = () => {
    const email = invoice.client?.contact?.includes('@') ? invoice.client.contact : ''
    const subject = encodeURIComponent(reminder.subject)
    const body = encodeURIComponent(reminder.message)
    const url = `mailto:${email}?subject=${subject}&body=${body}`
    window.open(url, '_blank')
  }

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <div className="ai-modal-title">
            <span className="ai-sparkle-icon">✨</span>
            <div>
              <h3>Redactor Inteligente de Cobro</h3>
              <p className="ai-modal-sub">
                Recordatorio para factura <strong>{invoice.invoiceNumber}</strong> ({invoice.client.name})
              </p>
            </div>
          </div>
          <button type="button" className="ai-modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ai-tone-selector">
          <span className="ai-tone-label">Tono del mensaje:</span>
          <div className="ai-tone-pills">
            <button
              type="button"
              className={`ai-tone-pill ${tone === 'amable' ? 'active' : ''}`}
              onClick={() => setTone('amable')}
            >
              🌿 Amable / Cordial
            </button>
            <button
              type="button"
              className={`ai-tone-pill ${tone === 'profesional' ? 'active' : ''}`}
              onClick={() => setTone('profesional')}
            >
              💼 Profesional
            </button>
            <button
              type="button"
              className={`ai-tone-pill ${tone === 'urgente' ? 'active' : ''}`}
              onClick={() => setTone('urgente')}
            >
              ⚡ Firme / Vencido
            </button>
          </div>
        </div>

        <div className="ai-preview-box">
          <div className="ai-preview-subject">
            <strong>Asunto:</strong> {reminder.subject}
          </div>
          <div className="ai-preview-body">{reminder.message}</div>
        </div>

        <div className="ai-modal-actions">
          <button
            type="button"
            className="erp-btn ai-action-btn"
            onClick={handleCopy}
          >
            {copied ? '✓ ¡Copiado!' : '📋 Copiar texto'}
          </button>
          <button
            type="button"
            className="erp-btn ai-action-whatsapp"
            onClick={handleWhatsApp}
          >
            💬 Abrir en WhatsApp
          </button>
          <button
            type="button"
            className="erp-btn ai-action-email"
            onClick={handleEmail}
          >
            ✉️ Enviar por Correo
          </button>
        </div>
      </div>
    </div>
  )
}

export default AiReminderModal
