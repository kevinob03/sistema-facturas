import { useState } from 'react'

const emptyItem = () => ({
  id: Date.now() + Math.random(),
  description: '',
  quantity: '',
  unitPrice: '',
})

function InvoiceForm({ onAddInvoice }) {
  const [issuerName, setIssuerName] = useState('')
  const [issuerTaxId, setIssuerTaxId] = useState('')
  const [clientName, setClientName] = useState('')
  const [clientContact, setClientContact] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [invoiceDate, setInvoiceDate] = useState('')
  const [items, setItems] = useState([emptyItem()])
  const [errors, setErrors] = useState({})

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

  const validate = () => {
    const newErrors = {}

    if (!issuerName.trim()) newErrors.issuerName = 'El nombre de la empresa es obligatorio'
    if (!issuerTaxId.trim()) newErrors.issuerTaxId = 'El RUC/NIT/ID fiscal es obligatorio'
    if (!clientName.trim()) newErrors.clientName = 'El nombre del cliente es obligatorio'
    if (!clientContact.trim())
      newErrors.clientContact = 'La dirección o correo es obligatorio'
    if (!invoiceNumber.trim()) newErrors.invoiceNumber = 'El número de factura es obligatorio'
    if (!invoiceDate) newErrors.invoiceDate = 'La fecha de emisión es obligatoria'

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
      },
      invoiceNumber: invoiceNumber.trim(),
      date: invoiceDate,
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
    setInvoiceNumber('')
    setInvoiceDate('')
    setItems([emptyItem()])
    setErrors({})
  }

  return (
    <form className="invoice-form" onSubmit={handleSubmit}>
      <h2>Crear Factura</h2>

      <fieldset>
        <legend>Datos del Emisor</legend>
        <div className="field">
          <label>
            Nombre de la empresa
            <input
              type="text"
              value={issuerName}
              onChange={(e) => setIssuerName(e.target.value)}
            />
          </label>
          {errors.issuerName && <p className="error">{errors.issuerName}</p>}
        </div>
        <div className="field">
          <label>
            RUC/NIT/ID fiscal
            <input
              type="text"
              value={issuerTaxId}
              onChange={(e) => setIssuerTaxId(e.target.value)}
            />
          </label>
          {errors.issuerTaxId && <p className="error">{errors.issuerTaxId}</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend>Datos del Cliente</legend>
        <div className="field">
          <label>
            Nombre del cliente
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </label>
          {errors.clientName && <p className="error">{errors.clientName}</p>}
        </div>
        <div className="field">
          <label>
            Dirección o correo
            <input
              type="text"
              value={clientContact}
              onChange={(e) => setClientContact(e.target.value)}
            />
          </label>
          {errors.clientContact && <p className="error">{errors.clientContact}</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend>Datos de la Factura</legend>
        <div className="field">
          <label>
            Número de factura
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </label>
          {errors.invoiceNumber && <p className="error">{errors.invoiceNumber}</p>}
        </div>
        <div className="field">
          <label>
            Fecha de emisión
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </label>
          {errors.invoiceDate && <p className="error">{errors.invoiceDate}</p>}
        </div>
      </fieldset>

      <fieldset>
        <legend>Ítems</legend>
        {items.map((item, index) => (
          <div className="item-row" key={item.id}>
            <div className="field item-description">
              <label>
                Descripción
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                />
              </label>
              {errors.items?.[index]?.description && (
                <p className="error">{errors.items[index].description}</p>
              )}
            </div>
            <div className="field">
              <label>
                Cantidad
                <input
                  type="text"
                  value={item.quantity}
                  onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                />
              </label>
              {errors.items?.[index]?.quantity && (
                <p className="error">{errors.items[index].quantity}</p>
              )}
            </div>
            <div className="field">
              <label>
                Precio unitario
                <input
                  type="text"
                  value={item.unitPrice}
                  onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                />
              </label>
              {errors.items?.[index]?.unitPrice && (
                <p className="error">{errors.items[index].unitPrice}</p>
              )}
            </div>
            <button
              type="button"
              className="remove-item"
              onClick={() => removeItem(index)}
              disabled={items.length === 1}
            >
              Eliminar
            </button>
          </div>
        ))}
        <button type="button" className="add-item" onClick={addItem}>
          Agregar ítem
        </button>
      </fieldset>

      <button type="submit" className="submit">
        Guardar factura
      </button>
    </form>
  )
}

export default InvoiceForm
