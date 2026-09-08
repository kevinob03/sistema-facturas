import { useState, useRef, useEffect } from 'react'
import {
  processCopilotMessage,
  getGeminiApiKey,
  saveGeminiApiKey,
} from '../utils/aiEngine'
import { formatMoney } from '../utils/invoiceCalculator'

const QUICK_PROMPTS = [
  '📊 Resumen general',
  '⏳ Facturas pendientes',
  '⚡ Crear factura rápida',
  '🏆 ¿Quién es el mejor cliente?',
  '💡 Diagnóstico de cartera',
]

function AiAssistantModal({
  invoices,
  onNavigate,
  onPreloadInvoice,
  onFilterStatus,
  onFilterClient,
  onShowToast,
  onUpdateInvoiceStatus,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey())
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: '¡Hola! Soy tu **Copiloto de Facturación**. Puedes pedirme que cree facturas, consulte cobranzas pendientes o analice tus métricas financieras.',
      actions: [
        { label: '📊 Resumen general', action: 'NAVIGATE', payload: 'dashboard' },
        { label: '⏳ Facturas pendientes', action: 'FILTER_STATUS', payload: 'emitida' },
      ],
    },
  ])

  const chatEndRef = useRef(null)
  const nextId = useRef(2)

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSend = async (textToSend) => {
    const text = (textToSend || input).trim()
    if (!text) return

    const userMsgId = nextId.current++
    const userMsg = {
      id: userMsgId,
      sender: 'user',
      text,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const response = await processCopilotMessage({
        query: text,
        invoices,
      })

      const aiMsgId = nextId.current++
      const aiMsg = {
        id: aiMsgId,
        sender: 'ai',
        text: response.text,
        type: response.type,
        data: response.data,
        actions: response.actions || [],
      }

      setMessages((prev) => [...prev, aiMsg])
    } catch {
      const errorMsgId = nextId.current++
      setMessages((prev) => [
        ...prev,
        {
          id: errorMsgId,
          sender: 'ai',
          text: 'Ocurrió un inconveniente al procesar tu solicitud. He activado el modo seguro local.',
          actions: [],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleActionClick = (action) => {
    if (action.action === 'NAVIGATE') {
      onNavigate(action.payload)
      onShowToast(`Navegando a ${action.payload}`)
    } else if (action.action === 'FILL_FORM') {
      onPreloadInvoice(action.payload)
      onNavigate('new')
      onShowToast('Datos cargados en el formulario de factura')
    } else if (action.action === 'FILTER_STATUS') {
      onFilterStatus(action.payload)
      onNavigate('list')
      onShowToast(`Filtrando facturas: ${action.payload}`)
    } else if (action.action === 'FILTER_CLIENT') {
      onFilterClient(action.payload)
      onNavigate('list')
      onShowToast(`Filtrando por cliente: ${action.payload}`)
    } else if (action.action === 'MARK_PAID' && onUpdateInvoiceStatus) {
      onUpdateInvoiceStatus(action.payload, 'pagada')
      onShowToast('Factura marcada como pagada')
    }
  }

  const handleSaveApiKey = () => {
    saveGeminiApiKey(apiKeyInput)
    setShowSettings(false)
    onShowToast(apiKeyInput.trim() ? 'Clave de Gemini guardada' : 'Clave de Gemini restablecida')
  }

  const activeKey = getGeminiApiKey()

  return (
    <>
      {/* Botón flotante siempre visible */}
      <button
        type="button"
        className={`ai-floating-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Copiloto de IA para Facturación"
      >
        <span className="ai-trigger-sparkle">✨</span>
        <span className="ai-trigger-label">Copiloto IA</span>
        <span className="ai-trigger-status" title={activeKey ? 'Conectado a Gemini' : 'Motor local activo'} />
      </button>

      {/* Ventana flotante del Copiloto */}
      {isOpen && (
        <div className="ai-copilot-panel card">
          <div className="ai-copilot-header">
            <div className="ai-copilot-brand">
              <span className="ai-copilot-avatar">✨</span>
              <div>
                <span className="ai-copilot-title">Copiloto Inteligente</span>
                <span className="ai-copilot-badge">
                  {activeKey ? 'Google Gemini Activo' : 'Motor Autónomo'}
                </span>
              </div>
            </div>
            <div className="ai-copilot-controls">
              <button
                type="button"
                className="ai-ctrl-btn"
                title="Configuración de IA"
                onClick={() => setShowSettings(!showSettings)}
              >
                ⚙️
              </button>
              <button
                type="button"
                className="ai-ctrl-btn"
                title="Cerrar Copiloto"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Ajustes de API Key desplegables */}
          {showSettings && (
            <div className="ai-settings-dropdown">
              <h4>Configuración de Google Gemini</h4>
              <p>Puedes usar tu clave de Google AI Studio o trabajar con el motor local sin API key.</p>
              <div className="ai-settings-input-wrap">
                <input
                  type="password"
                  placeholder="Pegar API Key (AIza... o AQ...)"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  className="erp-btn erp-btn-primary"
                  onClick={handleSaveApiKey}
                >
                  Guardar
                </button>
              </div>
            </div>
          )}

          {/* Cuerpo del chat */}
          <div className="ai-copilot-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`ai-message-row ${msg.sender}`}>
                <div className="ai-bubble">
                  <div className="ai-bubble-content">
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      }} />
                    ))}
                  </div>

                  {/* Previsualización estructurada si es propuesta de factura */}
                  {msg.type === 'INVOICE_PROPOSAL' && msg.data && (
                    <div className="ai-invoice-card">
                      <div className="ai-inv-client">
                        <strong>Cliente:</strong> {msg.data.clientName || 'Sin asignar'}
                        {msg.data.clientTaxId && <span> · ID: {msg.data.clientTaxId}</span>}
                      </div>
                      <div className="ai-inv-items">
                        {msg.data.items?.map((it, i) => (
                          <div key={i} className="ai-inv-item-row">
                            <span>{it.quantity}x {it.description}</span>
                            <span>{formatMoney(Number(it.unitPrice) * Number(it.quantity))}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Acciones interactivas en el mensaje */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="ai-bubble-actions">
                      {msg.actions.map((act, i) => (
                        <button
                          key={i}
                          type="button"
                          className="ai-action-chip"
                          onClick={() => handleActionClick(act)}
                        >
                          {act.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row ai">
                <div className="ai-bubble ai-loading-bubble">
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                  <span className="ai-dot" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Sugerencias rápidas */}
          <div className="ai-copilot-prompts">
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                type="button"
                className="ai-quick-prompt-pill"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Barra de entrada */}
          <form
            className="ai-copilot-form"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <input
              type="text"
              placeholder="Pregunta o escribe una orden (ej: factura a Juan 3 teclados a $25)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              className="ai-send-btn"
              disabled={loading || !input.trim()}
              aria-label="Enviar"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  )
}

export default AiAssistantModal
