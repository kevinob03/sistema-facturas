function InvoiceFilters({
  query,
  onQueryChange,
  clients,
  clientFilter,
  onClientFilterChange,
  dateFilter,
  onDateFilterChange,
  amountFilter,
  onAmountFilterChange,
  onClear,
  hasActive,
}) {
  return (
    <div className="invoice-filters card">
      <div className="filters-grid">
        <div className="filter-field">
          <label htmlFor="search">Buscar</label>
          <input
            id="search"
            type="text"
            placeholder="Número o cliente"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
          />
        </div>

        <div className="filter-field">
          <label htmlFor="clientFilter">Cliente</label>
          <select
            id="clientFilter"
            value={clientFilter}
            onChange={(e) => onClientFilterChange(e.target.value)}
          >
            <option value="">Todos los clientes</option>
            {clients.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="dateFilter">Fecha</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
          >
            <option value="all">Todas las fechas</option>
            <option value="7">Últimos 7 días</option>
            <option value="30">Últimos 30 días</option>
          </select>
        </div>

        <div className="filter-field">
          <label htmlFor="amountFilter">Monto</label>
          <select
            id="amountFilter"
            value={amountFilter}
            onChange={(e) => onAmountFilterChange(e.target.value)}
          >
            <option value="all">Todos los montos</option>
            <option value="lt100">Menos de 100</option>
            <option value="100to500">100 a 500</option>
            <option value="gt500">Más de 500</option>
          </select>
        </div>

        <div className="filter-clear">
          <button type="button" className="btn-secondary" onClick={onClear} disabled={!hasActive}>
            Limpiar filtros
          </button>
        </div>
      </div>
    </div>
  )
}

export default InvoiceFilters