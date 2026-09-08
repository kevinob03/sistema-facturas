import { useState } from 'react'
import { parseInvoiceWithAi } from '../utils/aiEngine'
import AppIcon from './AppIcon'

const EXAMPLES = [
  'Facturar a María López 2 monitores a 180 y 1 mouse a 25 con IVA 13%',
  '3 horas de consultoría de software a 60 para Carlos Gómez',
  'Factura a Juan Pérez cédula 102340567 por 1 laptop a 950',
]

function AiQuickInvoiceBar({ onFillForm }) {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)

  const handleProcess = async (textToUse) => {
    const query = (textToUse || prompt).trim()
    if (!query) return

    setLoading(true)
    try {
      const parsedData = await parseInvoiceWithAi(query)
      onFillForm(parsedData)
      setPrompt('')
    } catch {
      // Manejado silenciosamente con fallback
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="ai-quick-bar card">
      <div className="ai-quick-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="ai-quick-title">
          <span className="ai-sparkle-icon"><AppIcon name="sparkles" size={16} /></span>
          <div>
            <strong>Facturación Rápida con IA</strong>
            <p className="ai-quick-sub">
              Escribe o pega pedidos de WhatsApp, correos o notas para autocompletar la factura
            </p>
          </div>
        </div>
        <button
          type="button"
          className="ai-toggle-btn"
          aria-label={isExpanded ? 'Contraer' : 'Expandir'}
        >
          {isExpanded ? '▲' : '▼'}
        </button>
      </div>

      {isExpanded && (
        <div className="ai-quick-body">
          <div className="ai-input-group">
            <input
              type="text"
              className="ai-prompt-input"
              placeholder="Ej: Facturar a Juan Pérez 2 laptops a 850 y 1 mouse a 20 con IVA 13%..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleProcess()
                }
              }}
              disabled={loading}
            />
            <button
              type="button"
              className="erp-btn erp-btn-primary ai-generate-btn"
              onClick={() => handleProcess()}
              disabled={loading || !prompt.trim()}
            >
              {loading ? (
                <>
                  <span className="ai-spinner" /> Procesando…
                </>
              ) : (
                <> Autocompletar</>
              )}
            </button>
          </div>

          <div className="ai-examples">
            <span className="ai-examples-label">Prueba rápida:</span>
            {EXAMPLES.map((ex, idx) => (
              <button
                key={idx}
                type="button"
                className="ai-example-chip"
                onClick={() => {
                  setPrompt(ex)
                  handleProcess(ex)
                }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AiQuickInvoiceBar
