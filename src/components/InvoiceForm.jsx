import { useState } from 'react'
import { TAX_RATE, getSubtotal, getTax, getTotal, formatMoney } from '../utils/invoiceCalculator'
import {
  lookupByIdentificacion,
  tipoIdentificacionLabel,
  cleanIdentificacion,
} from '../utils/haciendaApi'
import AiQuickInvoiceBar from './AiQuickInvoiceBar'

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  quantity: '',
  unitPrice: '',
})

function InvoiceForm({ onAddInvoice, nextNumber = '', existingNumbers = [], preloadedData = null }) {
  const [issuerName, setIssuerName] = useState('')
  const [issuerTaxId, setIssuerTaxId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [clientTaxId, setClientTaxId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState(nextNumber)
  const [invoiceDate, setInvoiceDate] = useState('')
  const [taxRate, setTaxRate] = useState(String(TAX_RATE * 100))
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})
  const [haciendaData, setHaciendaData] = useState(null)
  const [haciendaLoading, setHaciendaLoading] = useState(false)
  const [haciendaError, setHaciendaError] = useState('')
  const [issuerHaciendaData, setIssuerHaciendaData] = useState(null)
  const [issuerHaciendaLoading, setIssuerHaciendaLoading] = useState(false)
  const [issuerHaciendaError, setIssuerHaciendaError] = useState('')
  const [activeParty, setActiveParty] = useState('issuer')

  const subtotal = getSubtotal(items)
  const enteredTaxRate = Number(taxRate)
  const appliedTaxRate = Number.isFinite(enteredTaxRate) ? enteredTaxRate / 100 : 0
  const tax = getTax(subtotal, appliedTaxRate)
  const total = getTotal(subtotal, tax)
  const taxPercent = enteredTaxRate || 0

  const handleItemChange = (index, field, value) => {
    setItems((prevItems) =>
      prevItems.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    )
  }

  const addItem = () => {
    setItems((prevItems) => [...prevItems, emptyItem()])
  }

  const removeItem = (index) => {
    setItems((prevItems) => prevItems.filter((_, i) => i !== index))
  }

  const handleAiFill = (data) => {
    if (!data) return
    if (data.clientName) setClientName(data.clientName)
    if (data.clientTaxId) setClientTaxId(data.clientTaxId)
    if (data.clientContact) setClientContact(data.clientContact)
    if (data.taxRate) setTaxRate(String(data.taxRate))
    if (data.items && data.items.length > 0) {
      setItems(data.items)
    }
    if (!invoiceDate) {
      const today = new Date().toISOString().split('T')[0]
      setInvoiceDate(today)
    }
    setErrors({})
  }

  const [prevPreloadedData, setPrevPreloadedData] = useState(null)
  if (preloadedData && preloadedData !== prevPreloadedData) {
    setPrevPreloadedData(preloadedData)
    if (preloadedData.clientName) setClientName(preloadedData.clientName)
    if (preloadedData.clientTaxId) setClientTaxId(preloadedData.clientTaxId)
    if (preloadedData.clientContact) setClientContact(preloadedData.clientContact)
    if (preloadedData.taxRate) setTaxRate(String(preloadedData.taxRate))
    if (preloadedData.items && preloadedData.items.length > 0) {
      setItems(preloadedData.items)
    }
  }

  const consultarCliente = async () => {
    if (!cleanIdentificacion(clientTaxId)) {
      setHaciendaError('Ingresa la cédula del cliente primero')
      setHaciendaData(null)
      return
    }

    setHaciendaLoading(true)
    setHaciendaError('')
    setHaciendaData(null)

    try {
      const data = await lookupByIdentificacion(clientTaxId)
      setHaciendaData(data)
      if (data.nombre) setClientName(data.nombre)
      setErrors((prev) => ({ ...prev, clientName: '' }))
    } catch (err) {
      setHaciendaError(err.message)
      setHaciendaData(null)
    } finally {
      setHaciendaLoading(false)
    }
  }

  const consultarEmisor = async () => {
    if (!cleanIdentificacion(issuerTaxId)) {
      setIssuerHaciendaError('Ingresa la identificación fiscal del emisor primero')
      setIssuerHaciendaData(null)
      return
    }

    setIssuerHaciendaLoading(true)
    setIssuerHaciendaError('')
    setIssuerHaciendaData(null)

    try {
      const data = await lookupByIdentificacion(issuerTaxId)
      setIssuerHaciendaData(data)
      if (data.nombre) setIssuerName(data.nombre)
      setErrors((prev) => ({ ...prev, issuerName: '', issuerTaxId: '' }))
    } catch (err) {
      setIssuerHaciendaError(err.message)
      setIssuerHaciendaData(null)
    } finally {
      setIssuerHaciendaLoading(false)
    }
  }

  const handleIssuerTaxIdChange = (value) => {
    setIssuerTaxId(value)
    setIssuerHaciendaError('')
    setIssuerHaciendaData(null)
  }
  const handleCedulaChange = (value) => {
    setClientTaxId(value)
    setHaciendaError('')
    setHaciendaData(null)
  }

  const validate = () => {
    const newErrors = {}

    if (!issuerName.trim()) newErrors.issuerName = 'El nombre de la empresa es obligatorio'
    if (!issuerTaxId.trim()) newErrors.issuerTaxId = 'El RUC/NIT/ID fiscal es obligatorio'
    if (!clientName.trim()) newErrors.clientName = 'El nombre del cliente es obligatorio'
    if (!clientContact.trim())
      newErrors.clientContact = 'La dirección o correo es obligatorio'
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = 'El número de factura es obligatorio'
    else if (existingNumbers.includes(invoiceNumber.trim()))
      newErrors.invoiceNumber = 'El número de factura ya existe'
    if (!invoiceDate) newErrors.invoiceDate = 'La fecha de emisión es obligatoria'
    if (taxRate === '' || !Number.isFinite(enteredTaxRate) || enteredTaxRate < 0 || enteredTaxRate > 100) {
      newErrors.taxRate = 'El impuesto debe estar entre 0 y 100'
    }

    const itemErrors = items.map((item) => {
      const err = {}
      if (!item.description.trim())
        err.description = 'La descripción es obligatoria'
      if (item.quantity === '' || !/^\d+(\.\d+)?$/.test(item.quantity) || Number(item.quantity) <= 0)
        err.quantity = 'Cantidad debe ser un número mayor que 0'
      if (item.unitPrice === '' || !/^\d+(\.\d+)?$/.test(item.unitPrice) || Number(item.unitPrice) < 0)
        err.unitPrice = 'Precio debe ser un número mayor o igual a 0'
      return err
    })

    newErrors.items = itemErrors

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const validationErrors = validate()
    setErrors(validationErrors)

    const hasErrors =
      Object.keys(validationErrors).some(
        (key) => key !== 'items' && validationErrors[key],
      ) || validationErrors.items.some((err) => Object.keys(err).length > 0)

    if (hasErrors) return

    const invoice = {
      id: Date.now(),
      issuer: {
        name: issuerName.trim(),
        taxId: issuerTaxId.trim(),
      },
      client: {
        name: clientName.trim(),
        contact: clientContact.trim(),
        taxId: cleanIdentificacion(clientTaxId) || undefined,
      },
      invoiceNumber: invoiceNumber.trim(),
      date: invoiceDate,
      taxRate: appliedTaxRate,
      status: 'emitida',
      items: items.map((item) => ({
        id: item.id,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    }

    onAddInvoice(invoice)

    setIssuerName('')
    setIssuerTaxId('')
    setClientName('')
    setClientContact('')
    setClientTaxId('')
    setInvoiceNumber('')
    setInvoiceDate('')
    setTaxRate(String(TAX_RATE * 100))
    setItems([emptyItem()])
    setErrors({})
    setHaciendaData(null)
    setHaciendaError('')
    setIssuerHaciendaData(null)
    setIssuerHaciendaError('')
  }

  return (
    <div className="invoice-form-view">
      <AiQuickInvoiceBar onFillForm={handleAiFill} />
      <form className="invoice-form card" onSubmit={handleSubmit}>
        <h2 className="form-title">Nueva factura</h2>

      <section className="party-selector" aria-label="Datos de la factura">
        <div className="party-selector-controls" role="tablist" aria-label="Seleccionar datos">
          <button
            type="button"
            role="tab"
            aria-selected={activeParty === 'issuer'}
            className={activeParty === 'issuer' ? 'party-selector-button is-active' : 'party-selector-button'}
            onClick={() => setActiveParty('issuer')}
          >
            Empresa
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeParty === 'client'}
            className={activeParty === 'client' ? 'party-selector-button is-active' : 'party-selector-button'}
            onClick={() => setActiveParty('client')}
          >
            Cliente
          </button>
        </div>

      {activeParty === 'issuer' ? (
      <section className="form-section form-section-emisor">
        <h3 className="form-section-title">Datos del emisor</h3>
        <div className="form-grid">
          <div className="field cedula-field">
            <label htmlFor="issuerTaxId">Identificación fiscal</label>
            <div className="cedula-lookup">
              <input
                id="issuerTaxId"
                type="text"
                placeholder="Ej. 3101123456"
                value={issuerTaxId}
                onChange={(e) => handleIssuerTaxIdChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    consultarEmisor()
                  }
                }}
                className={errors.issuerTaxId ? 'input-error' : ''}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={consultarEmisor}
                disabled={issuerHaciendaLoading}
              >
                {issuerHaciendaLoading ? 'Consultando…' : 'Consultar Hacienda'}
              </button>
            </div>
            {errors.issuerTaxId && <p className="error">{errors.issuerTaxId}</p>}
            {issuerHaciendaError && <p className="error">{issuerHaciendaError}</p>}
            {issuerHaciendaData && (
              <div className="hacienda-chip">
                <span className="hacienda-chip-name">{issuerHaciendaData.nombre}</span>
                <span className="hacienda-chip-tag">
                  {tipoIdentificacionLabel(issuerHaciendaData.tipoIdentificacion)}
                </span>
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="issuerName">Nombre de la empresa</label>
            <input
              id="issuerName"
              type="text"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
              className={errors.issuerName ? 'input-error' : ''}
            />
            {errors.issuerName && <p className="error">{errors.issuerName}</p>}
          </div>
        </div>
      </section>
      ) : (
      <section className="form-section form-section-cliente">
        <h3 className="form-section-title">Datos del cliente</h3>
        <div className="form-grid">
          <div className="field cedula-field">
            <label htmlFor="clientTaxId">Cédula del cliente (física o jurídica)</label>
            <div className="cedula-lookup">
              <input
                id="clientTaxId"
                type="text"
                placeholder="Ej. 2100042005"
                value={clientTaxId}
                onChange={(e) => handleCedulaChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    consultarCliente()
                  }
                }}
              />
              <button
                type="button"
                className="btn-secondary"
                onClick={consultarCliente}
                disabled={haciendaLoading}
              >
                {haciendaLoading ? 'Consultando…' : 'Consultar Hacienda'}
              </button>
            </div>
            {haciendaError && <p className="error">{haciendaError}</p>}
            {haciendaData && (
              <div className="hacienda-chip">
                <span className="hacienda-chip-name">{haciendaData.nombre}</span>
                <span className="hacienda-chip-tag">
                  {tipoIdentificacionLabel(haciendaData.tipoIdentificacion)}
                </span>
                <span className="hacienda-chip-tag">
                  {haciendaData.situacion?.estado || 'Sin estado'}
                </span>
                <span
                  className={`hacienda-chip-status${
                    haciendaData.situacion?.moroso === 'SI' ||
                    haciendaData.situacion?.omiso === 'SI'
                      ? ' hacienda-chip-status-alerta'
                      : ''
                  }`}
                >
                  {haciendaData.situacion?.moroso === 'SI' ? 'Moroso' : 'No moroso'} ·{' '}
                  {haciendaData.situacion?.omiso === 'SI' ? 'omiso' : 'al corriente'}
                </span>
                {haciendaData.situacion?.administracionTributaria && (
                  <span className="hacienda-chip-meta">
                    {haciendaData.situacion.administracionTributaria}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="field">
            <label htmlFor="clientName">Nombre del cliente</label>
            <input
              id="clientName"
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className={errors.clientName ? 'input-error' : ''}
            />
            {errors.clientName && <p className="error">{errors.clientName}</p>}
          </div>
          <div className="field">
            <label htmlFor="clientContact">Dirección o correo</label>
            <input
              id="clientContact"
              type="text"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
              className={errors.clientContact ? 'input-error' : ''}
            />
            {errors.clientContact && <p className="error">{errors.clientContact}</p>}
          </div>
        </div>
      </section>      )}
      </section>

      <section className="form-section form-section-datos">
        <h3 className="form-section-title">Datos de la factura</h3>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="invoiceNumber">Número de factura</label>
            <input
              id="invoiceNumber"
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className={errors.invoiceNumber ? 'input-error' : ''}
            />
            {errors.invoiceNumber && <p className="error">{errors.invoiceNumber}</p>}
          </div>
          <div className="field">
            <label htmlFor="invoiceDate">Fecha de emisión</label>
            <input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={errors.invoiceDate ? 'input-error' : ''}
            />
            {errors.invoiceDate && <p className="error">{errors.invoiceDate}</p>}
          </div>
                  <div className="field">
            <label htmlFor="taxRate">Impuesto (%)</label>
            <input
              id="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={errors.taxRate ? 'input-error' : ''}
            />
            {errors.taxRate && <p className="error">{errors.taxRate}</p>}
          </div>        </div>
      </section>

      <section className="form-section form-section-items">
        <h3 className="form-section-title">Ítems</h3>

        <div className="items-header">
          <span>Descripción</span>
          <span>Cantidad</span>
          <span>Precio unitario</span>
          <span></span>
        </div>

        {items.map((item, index) => (
          <div className="item-line" key={item.id}>
            <div className="field item-description">
              <input
                type="text"
                placeholder="Descripción del producto o servicio"
                value={item.description}
                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                className={errors.items?.[index]?.description ? 'input-error' : ''}
              />
              {errors.items?.[index]?.description && (
                <p className="error">{errors.items[index].description}</p>
              )}
            </div>
            <div className="field">
              <input
                type="text"
                placeholder="0"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                className={errors.items?.[index]?.quantity ? 'input-error' : ''}
              />
              {errors.items?.[index]?.quantity && (
                <p className="error">{errors.items[index].quantity}</p>
              )}
            </div>
            <div className="field">
              <input
                type="text"
                placeholder="0.00"
                value={item.unitPrice}
                onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                className={errors.items?.[index]?.unitPrice ? 'input-error' : ''}
              />
              {errors.items?.[index]?.unitPrice && (
                <p className="error">{errors.items[index].unitPrice}</p>
              )}
            </div>
            <button
              type="button"
              className="btn-remove"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
            >
              Eliminar
            </button>
          </div>
        ))}

        <button type="button" className="btn-secondary" onClick={addItem}>
          Agregar ítem
        </button>
      </section>

      <section className="form-section">
        <h3 className="form-section-title">Resumen en vivo</h3>
        <div className="form-summary">
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
      </section>

      <div className="form-actions">
        <button type="submit" className="btn-primary">
          Guardar factura
        </button>
      </div>
    </form>
  </div>
  )
}

export default InvoiceForm