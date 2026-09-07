import InvoiceForm from './components/InvoiceForm'
import InvoiceList from './components/InvoiceList'
import './App.css'

function App() {
  return (
    <div className="app">
      <h1>Sistema de Facturas</h1>
      <InvoiceForm />
      <InvoiceList />
    </div>
  )
}

export default App
