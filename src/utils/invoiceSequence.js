export const getNextInvoiceNumber = (invoices) => {
  let max = 0

  invoices.forEach((invoice) => {
    const match = String(invoice.invoiceNumber).match(/(\d+)$/)
    if (match) {
      const num = Number(match[1])
      if (num > max) max = num
    }
  })

  return `F-${String(max + 1).padStart(3, '0')}`
}