import { useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoiceList from './components/InvoiceList'
import './App.css'

function App() {
  const [invoices, setInvoices] = useState([])

  const addInvoice = (invoice) => {
    setInvoices((prevInvoices) => [...prevInvoices, invoice])
  }

  return (
    <div className="app">
      <h1>Sistema de Facturas</h1>
      <InvoiceForm onAddInvoice={addInvoice} />
      <InvoiceList invoices={invoices} />
    </div>
  )
}

export default App
