import { getInvoiceTotal } from './invoiceCalculator'

export const filterInvoices = (invoices, { query, clientFilter, dateFilter, amountFilter }) => {
  const term = query.trim().toLowerCase()

  return invoices.filter((invoice) => {
    const matchesQuery =
      !term ||
      invoice.invoiceNumber.toLowerCase().includes(term) ||
      invoice.client.name.toLowerCase().includes(term)

    const matchesClient = !clientFilter || invoice.client.name === clientFilter

    let matchesDate = true
    if (dateFilter === '7' || dateFilter === '30') {
      const days = Number(dateFilter)
      const today = new Date()
      const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())
      const [year, month, day] = invoice.date.split('-').map(Number)
      const invoiceDay = new Date(year, month - 1, day)
      const diffDays = Math.round((startOfToday - invoiceDay) / 86400000)
      matchesDate = diffDays >= 0 && diffDays <= days
    }

    const total = getInvoiceTotal(invoice)

    let matchesAmount = true
    if (amountFilter === 'lt100') matchesAmount = total < 100
    if (amountFilter === '100to500') matchesAmount = total >= 100 && total <= 500
    if (amountFilter === 'gt500') matchesAmount = total > 500

    return matchesQuery && matchesClient && matchesDate && matchesAmount
  })
}

export const hasActiveFilters = ({ query, clientFilter, dateFilter, amountFilter }) =>
  query.trim() !== '' || clientFilter !== '' || dateFilter !== 'all' || amountFilter !== 'all'

export const sortInvoices = (invoices, key, direction) => {
  const sorted = [...invoices]

  sorted.sort((a, b) => {
    let result = 0

    if (key === 'invoiceNumber') {
      result = a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, {
        numeric: true,
        sensitivity: 'base',
      })
    } else if (key === 'client') {
      result = a.client.name.localeCompare(b.client.name, undefined, { sensitivity: 'base' })
    } else if (key === 'date') {
      result = a.date.localeCompare(b.date)
    } else if (key === 'total') {
      result = getInvoiceTotal(a) - getInvoiceTotal(b)
    }

    return direction === 'asc' ? result : -result
  })

  return sorted
}