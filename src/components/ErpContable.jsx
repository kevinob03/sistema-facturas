import { useEffect, useMemo, useRef, useState } from 'react'
import { formatMoney, getSubtotal, getTax } from '../utils/invoiceCalculator'
import { sortInvoices } from '../utils/invoiceFilters'
import InvoiceForm from './InvoiceForm'
import Invoice from './Invoice'
import './ErpContable.css'

function ErpIcon({ name, size = 15 }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  }
  switch (name) {
    case 'arrow-left':
      return (
        <svg {...common}>
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      )
    case 'chevron-left':
      return (
        <svg {...common}>
          <polyline points="15 18 9 12 15 6" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...common}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
      )
    case 'x':
      return (
        <svg {...common}>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )
    case 'columns':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common}>
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    case 'ledger':
      return (
        <svg {...common}>
          <path d="M4 3h16a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
          <line x1="8" y1="8" x2="16" y2="8" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="16" x2="12" y2="16" />
        </svg>
      )
    case 'scale':
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M7 21h10" />
          <path d="M5 7h14" />
          <path d="M12 3 7 7h10l-5-4z" />
        </svg>
      )
    case 'refresh':
      return (
        <svg {...common}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      )
    case 'file':
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      )
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      )
    case 'check':
      return (
        <svg {...common}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      )
    default:
      return null
  }
}

const STATUS_META = {
  pagada: { label: 'Pagada', tag: 'verde' },
  emitida: { label: 'Emitida / Vigente', tag: 'azul' },
  anulada: { label: 'Anulada', tag: 'gris' },
}

const TABS = [
  { key: 'todas', label: 'Todas las CÃ©dulas' },
  { key: 'pagada', label: 'Cobradas / Liquidadas' },
  { key: 'emitida', label: 'Pendientes / Vigentes' },
  { key: 'anulada', label: 'Anuladas' },
]

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

function fmtDate(iso) {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function monthLabel(monthKey) {
  const [y, m] = monthKey.split('-')
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`
}

function StatusBadgeErp({ status, conciliado }) {
  if (conciliado) return <span className="erp-badge erp-badge-turquesa">Conciliado Banco</span>
  const meta = STATUS_META[status] || {}
  return <span className={`erp-badge erp-badge-${meta.tag}`}>{meta.label}</span>
}

function generateCFDI(invoice) {
  const neto = getSubtotal(invoice.items)
  const iva = getTax(neto)
  const total = neto + iva
  const rfc = invoice.client.taxId || 'XAXX010101000'
  const conceptos = invoice.items
    .map((item) => {
      const importe = (Number(item.quantity) * Number(item.unitPrice)).toFixed(2)
      return `    <cfdi:Concepto ClaveProdServ="84111506" Cantidad="${item.quantity}" ClaveUnidad="ACT" Descripcion="${item.description}" ValorUnitario="${Number(item.unitPrice).toFixed(2)}" Importe="${importe}" />`
    })
    .join('\n')
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<cfdi:Comprobante xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="F"',
    `    Folio="${invoice.invoiceNumber}" Fecha="${invoice.date}T12:00:00" FormaPago="03" MetodoPago="PUE" TipoDeComprobante="I" Moneda="MXN" Total="${total.toFixed(2)}" SubTotal="${neto.toFixed(2)}">`,
    `  <cfdi:Emisor Rfc="${invoice.issuer.taxId}" Nombre="${invoice.issuer.name}" RegimenFiscal="601" />`,
    `  <cfdi:Receptor Rfc="${rfc}" Nombre="${invoice.client.name}" UsoCFDI="G03" />`,
    '  <cfdi:Conceptos>',
    conceptos,
    '  </cfdi:Conceptos>',
    `  <cfdi:Impuestos TotalImpuestosTrasladados="${iva.toFixed(2)}"><cfdi:Traslados><cfdi:Traslado Base="${neto.toFixed(2)}" Impuesto="002" TipoFactor="Tasa" TasaOCuota="0.160000" Importe="${iva.toFixed(2)}" /></cfdi:Traslados></cfdi:Impuestos>`,
    '</cfdi:Comprobante>',
  ].join('\n')
}

function buildRep(invoice) {
  const neto = getSubtotal(invoice.items)
  const iva = getTax(neto)
  const total = neto + iva
  const rfc = invoice.client.taxId || 'XAXX010101000'
  return [
    `REPRESENTACIÃ“N IMPRESA DE COMPROBANTE FISCAL`,
    ``,
    `Folio: ${invoice.invoiceNumber}            Fecha: ${invoice.date}`,
    `Estatus: ${invoice.status.toUpperCase()}            Tipo: Ingreso (I)`,
    ``,
    `EMISOR`,
    `  Ruc/NIT: ${invoice.issuer.taxId}`,
    `  RazÃ³n social: ${invoice.issuer.name}`,
    ``,
    `RECEPTOR`,
    `  Ruc/NIT: ${rfc}`,
    `  RazÃ³n social: ${invoice.client.name}`,
    `  Contacto: ${invoice.client.contact || 'â€”'}`,
    ``,
    `Importe total: ${formatMoney(total)}`,
    `  Subtotal: ${formatMoney(neto)}`,
    `  Impuesto (16%): ${formatMoney(iva)}`,
  ].join('\n')
}

function SidebarNav({ collapsed, onToggle, view, onNavigate, foliosEmitidos, cobradoPct }) {
  const groups = [
    {
      title: 'OperaciÃ³n & FacturaciÃ³n',
      items: [
        { key: 'grid', label: 'Cuentas x Cobrar', icon: 'wallet' },
        { key: 'form', label: 'Emitir CFDI', icon: 'plus' },
      ],
    },
    {
      title: 'Contabilidad Central',
      items: [
        { key: 'diario', label: 'Libro Diario', icon: 'ledger' },
        { key: 'balanza', label: 'Balanza', icon: 'scale' },
      ],
    },
  ]
  return (
    <div className={`erp-sidebar${collapsed ? ' collapsed' : ''}`}>
      <div className="erp-side-head">
        <span className="erp-side-monogram">
          <ErpIcon name="columns" size={15} />
        </span>
        {!collapsed && <span className="erp-side-title">NavegaciÃ³n ERP</span>}
        <button
          type="button"
          className="erp-side-toggle"
          onClick={onToggle}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <ErpIcon name="chevron-left" size={14} />
        </button>
      </div>

      {groups.map((group) => (
        <div className="erp-side-group" key={group.title}>
          {!collapsed && <div className="erp-side-label">{group.title}</div>}
          {group.items.map((item) => (
            <div
              key={item.key}
              className={`erp-side-item${view === item.key ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={() => onNavigate(item.key)}
              role="button"
            >
              <span className="erp-side-icon">
                <ErpIcon name={item.icon} size={15} />
              </span>
              {!collapsed && <span className="erp-side-text">{item.label}</span>}
              {!collapsed && view === item.key && <span className="erp-side-dot" />}
            </div>
          ))}
        </div>
      ))}

      <div className="erp-side-foot">
        {!collapsed && (
          <>
            <div className="erp-side-label">Efectividad de cobranza</div>
            <div className="erp-quota">
              <span className="erp-quota-num mono">{cobradoPct}%</span>
              <span className="erp-quota-total"> Â· {foliosEmitidos} folios emitidos</span>
            </div>
            <div className="erp-quota-bar">
              <span className="erp-quota-fill" style={{ width: `${cobradoPct}%` }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function ErpTopbar() {
  return (
    <header className="erp-topbar">
      <div className="erp-brand">
        <span className="erp-monogram">ERP</span>
        <div className="erp-brand-text">
          <span className="erp-brand-name">SISTEMA DE FACTURAS</span>
          <span className="erp-brand-sub">Facturación, contabilidad y cuentas por cobrar</span>
        </div>
      </div>

      <div className="erp-nodes">
        <div className="erp-node">
          <span className="erp-node-label">Sociedad</span>
          <span className="erp-node-value mono">MX-1029 FIS</span>
        </div>
        <span className="erp-node-sep" />
        <div className="erp-node">
          <span className="erp-node-label">Centro de costos</span>
          <span className="erp-node-value mono">CC-04 CORP METRO</span>
        </div>
        <span className="erp-node-sep" />
        <div className="erp-node">
          <span className="erp-node-label">Servidor fiscal / PAC</span>
          <span className="erp-node-value erp-node-pac">
            <span className="erp-pulse" />
            WS PAC: 18ms Â· En lÃ­nea
          </span>
        </div>
      </div>

      <div className="erp-user">
        <span className="erp-avatar">LM</span>
        <div className="erp-user-text">
          <span className="erp-user-name">Lic. Morales V.</span>
          <span className="erp-user-role">Auditor Senior</span>
        </div>
      </div>
    </header>
  )
}

function KpiCard({ title, value, footnote, tone = 'default', progress }) {
  return (
    <div className={`erp-kpi erp-kpi-${tone}`}>
      <div className="erp-kpi-title">{title}</div>
      <div className="erp-kpi-value mono">{value}</div>
      {progress != null && (
        <div className="erp-kpi-progress">
          <span style={{ width: `${progress}%` }} />
        </div>
      )}
      <div className={`erp-kpi-foot${tone === 'rojo' ? ' erp-kpi-foot-rojo' : ''}`}>{footnote}</div>
    </div>
  )
}

const Th = ({ label, k, className = '', sortKey, sortDir, onSort }) => (
  <th
    className={`erp-th ${className}${sortKey === k ? ' erp-th-active' : ''}`}
    onClick={() => onSort(k)}
  >
    <span>{label}</span>
    {sortKey === k && <span className="mono erp-sort-arrow">{sortDir === 'asc' ? 'â†‘' : 'â†“'}</span>}
  </th>
)

function Modal({ title, onClose, children }) {
  return (
    <div className="erp-modal-overlay" onClick={onClose}>
      <div className="erp-modal" onClick={(e) => e.stopPropagation()}>
        <div className="erp-modal-head">
          <span className="erp-modal-title">{title}</span>
          <button type="button" className="erp-btn-icon" onClick={onClose}>
            <ErpIcon name="x" size={14} />
          </button>
        </div>
        <div className="erp-modal-body">{children}</div>
      </div>
    </div>
  )
}

function ErpLayout({ view, onNavigate, collapsed, onToggle, foliosEmitidos, cobradoPct, children }) {
  return (
    <div className="erp">
      <ErpTopbar />
      <div className="erp-body">
        <SidebarNav
          collapsed={collapsed}
          onToggle={onToggle}
          view={view}
          onNavigate={onNavigate}
          foliosEmitidos={foliosEmitidos}
          cobradoPct={cobradoPct}
        />
        <main className="erp-main">{children}</main>
      </div>
    </div>
  )
}

function ErpContable({
  invoices,
  onAdd,
  onSelectInvoice,
  onUpdateStatus,
  nextInvoiceNumber,
  existingNumbers,
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [view, setView] = useState('grid')
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('todas')
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [sortKey, setSortKey] = useState('date')
  const [sortDir, setSortDir] = useState('desc')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const [internalSelected, setInternalSelected] = useState(null)
  const [confirmAnular, setConfirmAnular] = useState(false)
  const [selected, setSelected] = useState({})
  const [conciliados, setConciliados] = useState(() => new Set())
  const [lastSync, setLastSync] = useState(null)
  const [modal, setModal] = useState(null)
  const [toast, setToast] = useState(null)
  const searchRef = useRef(null)
  const toastTimer = useRef(null)

  const showToast = (message) => {
    setToast(message)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 2500)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'F3') {
        e.preventDefault()
        searchRef.current?.focus()
        searchRef.current?.select()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => () => clearTimeout(toastTimer.current), [])

  const changeView = (nextView) => {
    setConfirmAnular(false)
    setModal(null)
    setView(nextView)
  }

  const years = useMemo(
    () => [...new Set(invoices.map((i) => i.date.slice(0, 4)))].sort().reverse(),
    [invoices],
  )

  const months = useMemo(() => {
    const prefix = selectedYear === 'all' ? '' : selectedYear
    const keys = new Set()
    invoices.forEach((i) => {
      if (!prefix || i.date.startsWith(prefix)) keys.add(i.date.slice(0, 7))
    })
    return [...keys].sort()
  }, [invoices, selectedYear])

  const counts = useMemo(() => {
    const c = { todas: invoices.length, pagada: 0, emitida: 0, anulada: 0 }
    invoices.forEach((invoice) => {
      if (invoice.status) c[invoice.status] += 1
    })
    return c
  }, [invoices])

  const matching = useMemo(() => {
    const statusOk = tab === 'todas' ? invoices : invoices.filter((i) => i.status === tab)
    return statusOk.filter((i) => {
      if (selectedYear !== 'all' && !i.date.startsWith(selectedYear)) return false
      if (selectedMonth !== 'all' && !i.date.startsWith(selectedMonth)) return false
      return true
    })
  }, [invoices, tab, selectedYear, selectedMonth])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    const base = term
      ? matching.filter(
          (invoice) =>
            invoice.invoiceNumber.toLowerCase().includes(term) ||
            invoice.client.name.toLowerCase().includes(term) ||
            invoice.issuer.name.toLowerCase().includes(term) ||
            invoice.client.contact.toLowerCase().includes(term),
        )
      : matching
    return sortInvoices(base, sortKey, sortDir)
  }, [matching, query, sortKey, sortDir])

  const totals = useMemo(() => {
    const res = { neto: 0, iva: 0, total: 0, cobrado: 0, pendiente: 0, anulado: 0 }
    invoices.forEach((invoice) => {
      const neto = getSubtotal(invoice.items)
      const iva = getTax(neto)
      const total = neto + iva
      res.neto += neto
      res.iva += iva
      res.total += total
      if (invoice.status === 'pagada') res.cobrado += total
      if (invoice.status === 'emitida') res.pendiente += total
      if (invoice.status === 'anulada') res.anulado += total
    })
    res.cobradoPct = res.total ? Math.round((res.cobrado / res.total) * 100) : 0
    return res
  }, [invoices])

  const journal = useMemo(() => {
    const rows = []
    invoices
      .filter((i) => i.status !== 'anulada')
      .sort((a, b) => a.date.localeCompare(b.date) || a.invoiceNumber.localeCompare(b.invoiceNumber, undefined, { numeric: true }))
      .forEach((i) => {
        const neto = getSubtotal(i.items)
        const iva = getTax(neto)
        const total = neto + iva
        rows.push({
          id: `${i.id}-d`,
          fecha: i.date,
          folio: i.invoiceNumber,
          concepto: 'Clientes (Cuentas por cobrar)',
          ref: i.client.name,
          debito: total,
          credito: 0,
        })
        rows.push({
          id: `${i.id}-c`,
          fecha: i.date,
          folio: i.invoiceNumber,
          concepto: 'Ingresos por servicios + IVA por liquidar',
          ref: i.client.name,
          debito: 0,
          credito: total,
        })
      })
    return rows
  }, [invoices])

  const balance = useMemo(() => {
    let cxc = 0
    let ventas = 0
    let iva = 0
    invoices
      .filter((i) => i.status !== 'anulada')
      .forEach((i) => {
        const neto = getSubtotal(i.items)
        const tax = getTax(neto)
        cxc += neto + tax
        ventas += neto
        iva += tax
      })
    return [
      { cuenta: 'Clientes (Cuentas por cobrar)', debito: cxc, credito: 0, saldo: 'Deudora' },
      { cuenta: 'Ingresos por servicios', debito: 0, credito: ventas, saldo: 'Acreedora' },
      { cuenta: 'IVA por liquidar', debito: 0, credito: iva, saldo: 'Acreedora' },
    ]
  }, [invoices])

  const pageCount = Math.max(1, Math.ceil(filtered.length / rowsPerPage))
  const safePage = Math.min(page, pageCount)
  const visible = filtered.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage)

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
    setPage(1)
  }

  const openDetail = (invoice) => {
    setInternalSelected(invoice)
    onSelectInvoice?.(invoice)
    changeView('detail')
  }

  const handleAddInvoice = (invoice) => {
    onAdd?.(invoice)
    setInternalSelected(invoice)
    setSelectedInvoiceSync(invoice)
    changeView('detail')
    showToast('Factura guardada')
  }

  const setSelectedInvoiceSync = (invoice) => {
    onSelectInvoice?.(invoice)
    setInternalSelected(invoice)
  }

  const updateStatus = (id, status) => {
    onUpdateStatus?.(id, status)
    setInternalSelected((prev) => (prev && prev.id === id ? { ...prev, status } : prev))
  }

  const selectedIds = Object.keys(selected).filter((id) => selected[id])
  const allVisibleChecked = visible.length > 0 && visible.every((r) => selected[r.id])
  const toggleRow = (id) => {
    setSelected((prev) => {
      const next = { ...prev }
      if (next[id]) delete next[id]
      else next[id] = true
      return next
    })
  }
  const toggleAll = () => {
    setSelected((prev) => {
      const next = { ...prev }
      visible.forEach((r) => {
        if (allVisibleChecked) delete next[r.id]
        else next[r.id] = true
      })
      return next
    })
  }
  const clearSelection = () => setSelected({})

  const markPaidSelected = () => {
    const paid = invoices.filter((i) => selected[i.id] && i.status === 'emitida')
    paid.forEach((i) => updateStatus(i.id, 'pagada'))
    if (paid.length) showToast(`${paid.length} cÃ©dula(s) marcada(s) como pagada(s)`)
    clearSelection()
  }

  const markAnuladoSelected = () => {
    const anular = invoices.filter((i) => selected[i.id] && i.status !== 'anulada')
    anular.forEach((i) => updateStatus(i.id, 'anulada'))
    if (anular.length) showToast(`${anular.length} cÃ©dula(s) anulada(s)`)
    clearSelection()
  }

  const conciliarSelected = () => {
    setConciliados((prev) => {
      const next = new Set(prev)
      selectedIds.forEach((id) => next.add(Number(id)))
      return next
    })
    showToast(`${selectedIds.length} cÃ©dula(s) conciliada(s) con el banco`)
    clearSelection()
  }

  const handleSyncBancos = () => {
    const payable = invoices.filter((i) => i.status === 'pagada')
    setConciliados((prev) => {
      const next = new Set(prev)
      payable.forEach((i) => next.add(i.id))
      return next
    })
    setLastSync(new Date())
    showToast(`Banco sincronizado Â· ${payable.length} movimiento(s) conciliado(s)`)
  }

  const openInvoiceModal = (invoice, type) => {
    const content =
      type === 'xml' ? (
        <pre className="erp-pre">{generateCFDI(invoice)}</pre>
      ) : type === 'rep' ? (
        <pre className="erp-pre erp-pre-rep">{buildRep(invoice)}</pre>
      ) : (
        <Invoice selectedInvoice={invoice} />
      )
    setModal({ title: `${invoice.invoiceNumber} Â· ${type.toUpperCase()}`, content })
  }

  const viewHead = (title, subtitle, children) => (
    <div className="erp-view-head">
      <div>
        <h2 className="erp-view-title">{title}</h2>
        <p className="erp-view-sub">{subtitle}</p>
      </div>
      {children && <div className="erp-view-actions">{children}</div>}
    </div>
  )

  const sidebarProps = {
    collapsed,
    onToggle: () => setCollapsed((c) => !c),
    view,
    onNavigate: changeView,
    foliosEmitidos: invoices.length,
    cobradoPct: totals.cobradoPct,
  }

  let body
  if (view === 'form') {
    body = (
      <ErpLayout {...sidebarProps}>
        {viewHead('Emitir CFDI', 'Registra una nueva factura electrÃ³nica', null)}
        <InvoiceForm
          onAddInvoice={handleAddInvoice}
          nextNumber={nextInvoiceNumber}
          existingNumbers={existingNumbers}
        />
      </ErpLayout>
    )
  } else if (view === 'detail') {
    const canMarkPaid = internalSelected?.status === 'emitida'
    const canAnular = internalSelected && internalSelected.status !== 'anulada'
    body = (
      <ErpLayout {...sidebarProps}>
        {viewHead(
          'Detalle de cÃ©dula',
          internalSelected ? internalSelected.invoiceNumber : 'Selecciona una factura',
          (
            <>
              <button type="button" className="erp-btn" onClick={() => changeView('grid')}>
                <ErpIcon name="arrow-left" size={13} /> Volver a cÃ©dulas
              </button>
              {canMarkPaid && (
                <button
                  type="button"
                  className="erp-btn"
                  onClick={() => {
                    updateStatus(internalSelected.id, 'pagada')
                    showToast('Factura marcada como pagada')
                  }}
                >
                  Marcar como pagada
                </button>
              )}
              {canAnular &&
                (confirmAnular ? (
                  <button
                    type="button"
                    className="erp-btn erp-btn-danger"
                    onClick={() => {
                      updateStatus(internalSelected.id, 'anulada')
                      setConfirmAnular(false)
                      showToast('Factura anulada')
                    }}
                  >
                    Â¿Confirmar anulaciÃ³n?
                  </button>
                ) : (
                  <button type="button" className="erp-btn erp-btn-danger" onClick={() => setConfirmAnular(true)}>
                    Anular
                  </button>
                ))}
            </>
          ),
        )}
        <Invoice selectedInvoice={internalSelected} />
      </ErpLayout>
    )
  } else if (view === 'diario') {
    const debitTotal = journal.reduce((acc, r) => acc + r.debito, 0)
    const creditTotal = journal.reduce((acc, r) => acc + r.credito, 0)
    body = (
      <ErpLayout {...sidebarProps}>
        {viewHead(
          'Libro Diario',
          'Registro cronolÃ³gico de partidas Â· DÃ©bito = CrÃ©dito',
          <button type="button" className="erp-btn" onClick={() => changeView('grid')}>
            <ErpIcon name="arrow-left" size={13} /> Volver a cÃ©dulas
          </button>,
        )}
        <div className="erp-table-card">
          <div className="erp-table-scroll">
            <table className="erp-table erp-table-accounts">
              <thead>
                <tr>
                  <th className="erp-th erp-th-nowrap">Fecha</th>
                  <th className="erp-th erp-th-nowrap">Folio</th>
                  <th className="erp-th">Cuenta / Concepto</th>
                  <th className="erp-th">Referencia</th>
                  <th className="erp-th erp-th-num">DÃ©bito</th>
                  <th className="erp-th erp-th-num">CrÃ©dito</th>
                </tr>
              </thead>
              <tbody>
                {journal.length === 0 && (
                  <tr>
                    <td colSpan="6" className="erp-empty">
                      Sin movimientos en el perÃ­odo.
                    </td>
                  </tr>
                )}
                {journal.map((row) => (
                  <tr key={row.id} className={row.debito ? 'erp-tr-debito' : ''}>
                    <td className="erp-td mono erp-td-nowrap">{fmtDate(row.fecha)}</td>
                    <td className="erp-td mono erp-td-nowrap">{row.folio}</td>
                    <td className="erp-td">
                      <span className="erp-cuenta">{row.concepto}</span>
                    </td>
                    <td className="erp-td">{row.ref}</td>
                    <td className="erp-td mono erp-td-num">{row.debito ? formatMoney(row.debito) : ''}</td>
                    <td className="erp-td mono erp-td-num">{row.credito ? formatMoney(row.credito) : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="erp-table-foot">
            <div className="erp-totals">
              <span className="erp-total-label">Totales</span>
              <span className="erp-total-value mono">DÃ©bito {formatMoney(debitTotal)}</span>
              <span className="erp-totals-sep" />
              <span className="erp-total-value mono erp-total-strong">
                CrÃ©dito {formatMoney(creditTotal)}
              </span>
              <span className="erp-totals-note">
                {Math.abs(debitTotal - creditTotal) < 0.01
                  ? 'Libro cuadrado Â· sin diferencias'
                  : 'Diferencias aritmÃ©ticas detectadas'}
              </span>
            </div>
          </div>
        </div>
      </ErpLayout>
    )
  } else if (view === 'balanza') {
    const tDeb = balance.reduce((acc, r) => acc + r.debito, 0)
    const tCred = balance.reduce((acc, r) => acc + r.credito, 0)
    body = (
      <ErpLayout {...sidebarProps}>
        {viewHead(
          'Balanza de ComprobaciÃ³n',
          'Movimientos por cuenta Â· sumas iguales',
          <button type="button" className="erp-btn" onClick={() => changeView('grid')}>
            <ErpIcon name="arrow-left" size={13} /> Volver a cÃ©dulas
          </button>,
        )}
        <div className="erp-table-card">
          <div className="erp-table-scroll">
            <table className="erp-table erp-table-accounts">
              <thead>
                <tr>
                  <th className="erp-th">Cuenta</th>
                  <th className="erp-th erp-th-num">DÃ©bitos</th>
                  <th className="erp-th erp-th-num">CrÃ©ditos</th>
                  <th className="erp-th erp-th-nowrap">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {balance.map((row) => (
                  <tr key={row.cuenta}>
                    <td className="erp-td">
                      <span className="erp-cuenta">{row.cuenta}</span>
                    </td>
                    <td className="erp-td mono erp-td-num">{formatMoney(row.debito)}</td>
                    <td className="erp-td mono erp-td-num">{formatMoney(row.credito)}</td>
                    <td className="erp-td erp-td-nowrap">
                      <span className="erp-badge erp-badge-gris">
                        {formatMoney(Math.max(row.debito, row.credito))} {row.saldo}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="erp-table-foot">
            <div className="erp-totals">
              <span className="erp-total-label">Totales</span>
              <span className="erp-total-value mono">DÃ©bitos {formatMoney(tDeb)}</span>
              <span className="erp-totals-sep" />
              <span className="erp-total-value mono erp-total-strong">
                CrÃ©ditos {formatMoney(tCred)}
              </span>
              <span className="erp-totals-note">
                {Math.abs(tDeb - tCred) < 0.01 ? 'Balanza cuadrada' : 'Diferencias detectadas'}
              </span>
            </div>
          </div>
        </div>
      </ErpLayout>
    )
  } else {
    const hasSelection = selectedIds.length > 0
    body = (
      <ErpLayout {...sidebarProps}>
        <div className="erp-toolbar">
          <div className="erp-selects">
            <label className="erp-field">
              <span className="erp-field-label">Ejercicio fiscal</span>
              <select
                className="erp-input mono"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value)
                  setSelectedMonth('all')
                  setPage(1)
                }}
              >
                <option value="all">Todos los ejercicios</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label className="erp-field">
              <span className="erp-field-label">Rango de fechas</span>
              <select
                className="erp-input mono"
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value)
                  setPage(1)
                }}
              >
                <option value="all">Todo el rango</option>
                {months.map((m) => (
                  <option key={m} value={m}>
                    {monthLabel(m)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="erp-search">
            <ErpIcon name="search" size={14} />
            <input
              ref={searchRef}
              className="erp-search-input"
              placeholder="[F3] Folio, RFC, RazÃ³n Social..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(1)
              }}
            />
            <kbd className="erp-kbd">F3</kbd>
          </div>

          <div className="erp-actions">
            <button type="button" className="erp-btn erp-btn-primary" onClick={() => changeView('form')}>
              <ErpIcon name="plus" size={13} /> Emitir CFDI
            </button>
            <button type="button" className="erp-btn" onClick={() => changeView('diario')}>
              <ErpIcon name="ledger" size={13} /> Libro Diario
            </button>
            <button type="button" className="erp-btn" onClick={() => changeView('balanza')}>
              <ErpIcon name="scale" size={13} /> Balanza
            </button>
            <button type="button" className="erp-btn" onClick={handleSyncBancos}>
              <ErpIcon name="refresh" size={13} /> Sincronizar Bancos
            </button>
          </div>
        </div>

        <div className="erp-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`erp-tab${tab === t.key ? ' active' : ''}`}
              onClick={() => {
                setTab(t.key)
                setPage(1)
              }}
            >
              {t.label}
              <span className={`erp-tab-count${t.key === 'anulada' ? ' erp-tab-count-rojo' : ''}`}>
                {counts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="erp-kpis">
          <KpiCard
            title="Total FacturaciÃ³n Emitida"
            value={formatMoney(totals.total)}
            footnote={`Base imponible ${formatMoney(totals.neto)} + IVA ${formatMoney(totals.iva)}`}
          />
          <KpiCard
            title="Cobrado en Firme"
            value={`${totals.cobradoPct}%`}
            progress={totals.cobradoPct}
            footnote={`Efectividad de cobranza Â· ${formatMoney(totals.cobrado)} liquidados`}
          />
          <KpiCard
            title="Pendientes / Vigentes"
            value={formatMoney(totals.pendiente)}
            footnote={`${counts.emitida} facturas sin liquidar`}
          />
          <KpiCard
            title="Anuladas"
            value={formatMoney(totals.anulado)}
            tone="rojo"
            footnote={`${counts.anulada} cÃ©dula(s) anulada(s) en el ejercicio`}
          />
        </div>

        {hasSelection && (
          <div className="erp-bulkbar">
            <span className="erp-bulkbar-count mono">{selectedIds.length} seleccionada(s)</span>
            <button type="button" className="erp-btn" onClick={markPaidSelected}>
              <ErpIcon name="check" size={12} /> Marcar como pagadas
            </button>
            <button type="button" className="erp-btn" onClick={conciliarSelected}>
              Conciliar Banco
            </button>
            <button type="button" className="erp-btn" onClick={markAnuladoSelected}>
              Anular
            </button>
            <button type="button" className="erp-btn" onClick={clearSelection}>
              Limpiar
            </button>
            {lastSync && (
              <span className="erp-last-sync mono">Ãšltima sinc.: {lastSync.toLocaleTimeString('es-CR')}</span>
            )}
          </div>
        )}

        <div className="erp-table-card">
          <div className="erp-table-scroll">
            <table className="erp-table">
              <thead>
                <tr>
                  <th className="erp-th erp-th-check">
                    <input type="checkbox" checked={allVisibleChecked} onChange={toggleAll} />
                  </th>
                  <Th label="Folio" k="invoiceNumber" className="erp-th-nowrap" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="erp-th erp-th-nowrap">Estatus CFDI</th>
                  <Th label="Receptor (RazÃ³n Social + RFC)" k="client" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <Th label="EmisiÃ³n" k="date" className="erp-th-nowrap" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <Th label="Importe Total (Neto + IVA)" k="total" className="erp-th-num" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} />
                  <th className="erp-th erp-th-nowrap">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 && (
                  <tr>
                    <td colSpan="7" className="erp-empty">
                      No hay cÃ©dulas que coincidan con los filtros actuales.
                    </td>
                  </tr>
                )}
                {visible.map((row) => {
                  const neto = getSubtotal(row.items)
                  const iva = getTax(neto)
                  const total = neto + iva
                  const conciliado = conciliados.has(row.id)
                  return (
                    <tr key={row.id} className={selected[row.id] ? 'erp-tr-selected' : ''}>
                      <td className="erp-td erp-td-check">
                        <input type="checkbox" checked={!!selected[row.id]} onChange={() => toggleRow(row.id)} />
                      </td>
                      <td className="erp-td erp-td-nowrap">
                        <div className="erp-folio">
                          <span className="erp-folio-main mono">{row.invoiceNumber}</span>
                          <span className="erp-folio-uuid mono">Ref #{row.id}</span>
                        </div>
                      </td>
                      <td className="erp-td erp-td-nowrap">
                        <StatusBadgeErp status={row.status} conciliado={conciliado} />
                      </td>
                      <td className="erp-td">
                        <div className="erp-receptor">
                          <span className="erp-receptor-name">{row.client.name}</span>
                          <span className="erp-receptor-rfc mono">
                            {row.client.taxId ? `CÃ©dula ${row.client.taxId}` : row.client.contact}
                          </span>
                        </div>
                      </td>
                      <td className="erp-td mono erp-td-num erp-td-nowrap">{fmtDate(row.date)}</td>
                      <td className="erp-td erp-td-num erp-td-nowrap">
                        <div className="erp-importe">
                          <span className="erp-importe-total mono">{formatMoney(total)}</span>
                          <span className="erp-importe-net mono">
                            Neto {formatMoney(neto)} + IVA {formatMoney(iva)}
                          </span>
                        </div>
                      </td>
                      <td className="erp-td erp-td-nowrap">
                        <div className="erp-row-actions">
                          <button type="button" className="erp-row-action mono" title="RepresentaciÃ³n PDF" onClick={() => openInvoiceModal(row, 'pdf')}>
                            PDF
                          </button>
                          <span className="erp-row-sep" />
                          <button type="button" className="erp-row-action mono" title="Archivo XML" onClick={() => openInvoiceModal(row, 'xml')}>
                            XML
                          </button>
                          <span className="erp-row-sep" />
                          <button type="button" className="erp-row-action mono" title="RepresentaciÃ³n impresa" onClick={() => openInvoiceModal(row, 'rep')}>
                            REP
                          </button>
                          <span className="erp-row-sep" />
                          <button type="button" className="erp-btn-sm" onClick={() => openDetail(row)}>
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className="erp-table-foot">
            <div className="erp-totals">
              <span className="erp-total-label">Subtotal Neto:</span>
              <span className="erp-total-value mono">{formatMoney(totals.neto)}</span>
              <span className="erp-totals-sep" />
              <span className="erp-total-label">Total Facturado:</span>
              <span className="erp-total-value mono erp-total-strong">{formatMoney(totals.total)}</span>
              <span className="erp-totals-note">
                Cuadre automÃ¡tico Â· {invoices.length} cÃ©dulas sin diferencias aritmÃ©ticas
              </span>
            </div>
            <div className="erp-quadro">
              <span className="erp-csd">
                <ErpIcon name="shield" size={12} />
                CSD habilitado para emisiÃ³n Â· <span className="mono">{years[0] || new Date().getFullYear()}</span>
              </span>
              <span className="erp-totals-sep" />
              <span className="erp-rows-per">
                Filas por pÃ¡gina
                <select
                  className="erp-input erp-input-xs mono"
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value))
                    setPage(1)
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </span>
              <span className="erp-page-info mono">
                {filtered.length === 0 ? 0 : (safePage - 1) * rowsPerPage + 1}
                â€“{Math.min(safePage * rowsPerPage, filtered.length)} de {filtered.length}
              </span>
              <button
                type="button"
                className="erp-btn-icon"
                disabled={safePage <= 1}
                onClick={() => setPage(safePage - 1)}
              >
                <ErpIcon name="chevron-left" size={14} />
              </button>
              <button
                type="button"
                className="erp-btn-icon"
                disabled={safePage >= pageCount}
                onClick={() => setPage(safePage + 1)}
              >
                <ErpIcon name="chevron-right" size={14} />
              </button>
            </div>
          </div>
        </div>
      </ErpLayout>
    )
  }

  return (
    <>
      {body}
      {toast && <div className="erp-toast">{toast}</div>}
      {modal && (
        <Modal title={modal.title} onClose={() => setModal(null)}>
          {modal.content}
        </Modal>
      )}
    </>
  )
}

export default ErpContable
