export const TAX_RATE = 0.16

export const getLineTotal = (item) => {
  const quantity = Number(item.quantity)
  const unitPrice = Number(item.unitPrice)
  if (Number.isNaN(quantity) || Number.isNaN(unitPrice)) return 0
  return quantity * unitPrice
}

export const getSubtotal = (items) => items.reduce((sum, item) => sum + getLineTotal(item), 0)

export const getTax = (subtotal, taxRate = TAX_RATE) => subtotal * taxRate

export const getTotal = (subtotal, tax) => subtotal + tax

export const getInvoiceTotal = (invoice) => {
  const taxRate = Number.isFinite(Number(invoice.taxRate)) ? Number(invoice.taxRate) : TAX_RATE
  const subtotal = getSubtotal(invoice.items)
  return getTotal(subtotal, getTax(subtotal, taxRate))
}

export const formatMoney = (value) =>
  `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`