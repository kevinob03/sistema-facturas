import { useCallback, useEffect, useRef, useState } from 'react'
import InvoiceForm from './components/InvoiceForm'
import InvoiceFilters from './components/InvoiceFilters'
import InvoiceList from './components/InvoiceList'
import Invoice from './components/Invoice'
import Dashboard from './components/Dashboard'
import Toast from './components/Toast'
import AiAssistantModal from './components/AiAssistantModal'
import TourButton from './components/TourButton'
import { useTour } from './hooks/useTour'
import demoInvoices from './data/demoInvoices'
import { getNextInvoiceNumber } from './utils/invoiceSequence'
import { filterInvoices, hasActiveFilters, sortInvoices } from './utils/invoiceFilters'
import { openInvoicePdf } from './utils/invoicePdf'
import './App.css'

const themes = [
  { id: 'blue', label: 'Claro' },
  { id: 'graphite', label: 'Oscuro' },
]
const navigation = [
  { key: 'dashboard', label: 'Dashboard', icon: '▦' },
  { key: 'new', label: 'Nueva factura', icon: '+' },
  { key: 'list', label: 'Facturas', icon: '▤' },
]

function App() {
  const [invoices, setInvoices] = useState(demoInvoices)
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [preloadedInvoiceData, setPreloadedInvoiceData] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [query, setQuery] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [amountFilter, setAmountFilter] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [toast, setToast] = useState(null)
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [theme, setTheme] = useState('blue')
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const [aiCloseRequest, setAiCloseRequest] = useState(0)
  const toastTimer = useRef(null)

  const closeAiForTour = useCallback(() => {
    setAiCloseRequest((request) => request + 1)
  }, [])

  const { startTour } = useTour({ activePage: page, autoStart: true, onStart: closeAiForTour })

  const showToast = (message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  useEffect(() => {
    document.body.setAttribute('data-theme', theme)
    document.body.classList.remove('theme-blue', 'theme-graphite')
    document.body.classList.add(`theme-${theme}`)
  }, [theme])

  const navigate = (nextPage) => {
    setConfirmAnular(false)
    setPage(nextPage)
  }

  const addInvoice = (invoice) => {
    setInvoices((currentInvoices) => [...currentInvoices, invoice])
    setSelectedInvoice(invoice)
    navigate('detail')
    showToast('Factura guardada')
  }

  const updateInvoiceStatus = (id, status) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) => (invoice.id === id ? { ...invoice, status } : invoice)),
    )
    setSelectedInvoice((currentInvoice) =>
      currentInvoice?.id === id ? { ...currentInvoice, status } : currentInvoice,
    )
  }

  const clearFilters = () => {
    setQuery('')
    setClientFilter('')
    setDateFilter('all')
    setAmountFilter('all')
  }

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((currentDir) => (currentDir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filters = { query, clientFilter, dateFilter, amountFilter }
  const filteredInvoices = filterInvoices(invoices, filters)
  const sortedInvoices = sortInvoices(filteredInvoices, sortKey, sortDir)
  const clients = [...new Set(invoices.map((invoice) => invoice.client.name))].sort()
  const nextInvoiceNumber = getNextInvoiceNumber(invoices)
  const existingNumbers = invoices.map((invoice) => invoice.invoiceNumber)
  const handleDownloadInvoice = () => {
    if (selectedInvoice && !openInvoicePdf(selectedInvoice)) {
      showToast('Permite las ventanas emergentes para descargar la factura')
    }
  }

  const canMarkPaid = selectedInvoice?.status === 'emitida'
  const canAnular = selectedInvoice && selectedInvoice.status !== 'anulada'
  const activeNavigation = page === 'detail' ? 'list' : page

  let content
  if (page === 'dashboard') {
    content = (
      <>
        <PageHeader title="Dashboard" subtitle="Resumen general de tu facturación" />
        <Dashboard
          invoices={invoices}
          onNavigate={navigate}
          onFilterStatus={(st) => {
            setQuery(st)
            navigate('list')
          }}
        />
      </>
    )
  } else if (page === 'new') {
    content = (
      <>
        <PageHeader title="Nueva factura" subtitle="Completa los datos para emitir una factura" />
        <InvoiceForm
          onAddInvoice={addInvoice}
          nextNumber={nextInvoiceNumber}
          existingNumbers={existingNumbers}
          preloadedData={preloadedInvoiceData}
        />
      </>
    )
  } else if (page === 'list') {
    content = (
      <>
        <PageHeader
          title="Facturas"
          subtitle="Crea, registra y consulta tus facturas"
          actions={<button type="button" className="erp-btn erp-btn-primary" onClick={() => navigate('new')}>+ Nueva factura</button>}
        />
        <InvoiceFilters
          query={query}
          onQueryChange={setQuery}
          clients={clients}
          clientFilter={clientFilter}
          onClientFilterChange={setClientFilter}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
          amountFilter={amountFilter}
          onAmountFilterChange={setAmountFilter}
          onClear={clearFilters}
          hasActive={hasActiveFilters(filters)}
        />
        <InvoiceList
          invoices={sortedInvoices}
          allInvoices={invoices}
          selectedInvoice={selectedInvoice}
          onSelectInvoice={(invoice) => { setSelectedInvoice(invoice); navigate('detail') }}
          hasActiveFilters={hasActiveFilters(filters)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
        />
      </>
    )
  } else {
    content = (
      <>
        <PageHeader
          title="Detalle de factura"
          subtitle={selectedInvoice?.invoiceNumber || 'Selecciona una factura'}
          actions={
            <>
              <button type="button" className="erp-btn" onClick={() => navigate('list')}>Volver a facturas</button>
              {selectedInvoice && <button type="button" className="erp-btn erp-btn-primary" onClick={handleDownloadInvoice}>Descargar PDF</button>}
              {canMarkPaid && <button type="button" className="erp-btn" onClick={() => { updateInvoiceStatus(selectedInvoice.id, 'pagada'); showToast('Factura marcada como pagada') }}>Marcar como pagada</button>}
              {canAnular && <button type="button" className="erp-btn erp-btn-danger" onClick={() => confirmAnular ? (updateInvoiceStatus(selectedInvoice.id, 'anulada'), setConfirmAnular(false), showToast('Factura anulada')) : setConfirmAnular(true)}>{confirmAnular ? 'Confirmar anulación' : 'Anular'}</button>}
            </>
          }
        />
        <Invoice selectedInvoice={selectedInvoice} onShowToast={showToast} />
      </>
    )
  }

  return (
    <div className={`erp factura-erp theme-${theme}`}>
      <header className="erp-topbar">
        <div className="erp-brand">
          <img className="erp-brand-logo" src="/favicon.svg" alt="" />
          <div className="erp-brand-text">
            <span className="erp-brand-name">SISTEMA DE FACTURAS</span>
            <span className="erp-brand-sub">Facturación y gestión de cobros</span>
          </div>
        </div>
        <div className="erp-nodes"><div className="erp-node"><span className="erp-node-label">Estado</span><span className="erp-node-value erp-node-pac"><span className="erp-pulse" />Sistema en línea</span></div></div>
        <TourButton onClick={() => startTour(page, true)} />
        <div className="theme-picker">
          <button
            type="button"
            className="theme-trigger"
            aria-expanded={themeMenuOpen}
            aria-controls="theme-options"
            onClick={() => setThemeMenuOpen((open) => !open)}
          >
            <svg className="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
            <span className="sr-only">Elegir tema</span>
          </button>
          {themeMenuOpen && (
            <div className="theme-options" id="theme-options">
              {themes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`theme-option${theme === item.id ? ' active' : ''}`}
                  onClick={() => {
                    setTheme(item.id)
                    setThemeMenuOpen(false)
                  }}
                >
                  <span className={`theme-swatch theme-swatch-${item.id}`} />
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="erp-body">
        <aside className="erp-sidebar">
          <div className="erp-side-head"><span className="erp-side-monogram">▦</span><span className="erp-side-title">Navegación</span></div>
          <div className="erp-side-group">
            <div className="erp-side-label">Facturación</div>
            {navigation.map((item) => <button key={item.key} type="button" className={`erp-side-item${activeNavigation === item.key ? ' active' : ''}`} onClick={() => navigate(item.key)}><span className="erp-side-icon">{item.icon}</span><span>{item.label}</span></button>)}
          </div>
        </aside>
        <main className="erp-main legacy-erp-content">{content}</main>
      </div>
      <AiAssistantModal
        key={aiCloseRequest}
        invoices={invoices}
        onNavigate={navigate}
        onPreloadInvoice={(data) => {
          setPreloadedInvoiceData(data)
          navigate('new')
        }}
        onFilterStatus={(status) => {
          setQuery(status)
          navigate('list')
        }}
        onFilterClient={(client) => {
          setClientFilter(client)
          navigate('list')
        }}
        onShowToast={showToast}
        onUpdateInvoiceStatus={updateInvoiceStatus}
      />
      <Toast message={toast} />
    </div>
  )
}

function PageHeader({ title, subtitle, actions }) {
  return <div className="erp-view-head legacy-erp-page-head"><div><h1 className="erp-view-title">{title}</h1><p className="erp-view-sub">{subtitle}</p></div>{actions && <div className="erp-view-actions">{actions}</div>}</div>
}

export default App
