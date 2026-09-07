const demoInvoices = [
  {
    id: 1001,
    status: 'emitida',
    issuer: { name: 'TechStore S.A.', taxId: '20123456789' },
    client: { name: 'Juan Pérez', contact: 'juan.perez@example.com' },
    invoiceNumber: 'F-001',
    date: '2026-09-05',
    items: [
      { id: 9001, description: 'Teclado mecánico', quantity: 2, unitPrice: 25 },
      { id: 9002, description: 'Mouse inalámbrico', quantity: 3, unitPrice: 12 },
    ],
  },
  {
    id: 1002,
    status: 'pagada',
    issuer: { name: 'Comercial Andina S.A.C.', taxId: '20111222333' },
    client: { name: 'María López', contact: 'Av. Central 450, Lima' },
    invoiceNumber: 'F-002',
    date: '2026-09-03',
    items: [
      { id: 9003, description: 'Monitor 24"', quantity: 2, unitPrice: 180 },
    ],
  },
  {
    id: 1003,
    status: 'pagada',
    issuer: { name: 'Distribuidora Norte S.R.L.', taxId: '20444555666' },
    client: { name: 'Carlos Gómez', contact: 'carlos.gomez@example.com' },
    invoiceNumber: 'F-003',
    date: '2026-08-28',
    items: [
      { id: 9004, description: 'Silla ergonómica', quantity: 1, unitPrice: 150 },
      { id: 9005, description: 'Escritorio de madera', quantity: 1, unitPrice: 220 },
    ],
  },
  {
    id: 1004,
    status: 'emitida',
    issuer: { name: 'TechStore S.A.', taxId: '20123456789' },
    client: { name: 'Lucía Fernández', contact: 'lucia.f@example.com' },
    invoiceNumber: 'F-004',
    date: '2026-09-01',
    items: [
      { id: 9006, description: 'Cámara web HD', quantity: 1, unitPrice: 60 },
      { id: 9007, description: 'Micrófono USB', quantity: 1, unitPrice: 45 },
    ],
  },
  {
    id: 1005,
    status: 'pagada',
    issuer: { name: 'Importadora Pacífico S.A.', taxId: '20777888999' },
    client: { name: 'TechMundo S.A.', contact: 'ventas@techmundo.com' },
    invoiceNumber: 'F-005',
    date: '2026-08-15',
    items: [
      { id: 9008, description: 'Laptop profesional', quantity: 1, unitPrice: 900 },
    ],
  },
  {
    id: 1006,
    status: 'emitida',
    issuer: { name: 'Comercial Andina S.A.C.', taxId: '20111222333' },
    client: { name: 'Ana Torres', contact: 'Jr. Los Olivos 120, Arequipa' },
    invoiceNumber: 'F-006',
    date: '2026-08-20',
    items: [
      { id: 9009, description: 'Tablet 10"', quantity: 1, unitPrice: 320 },
      { id: 9010, description: 'Funda protectora', quantity: 1, unitPrice: 20 },
      { id: 9011, description: 'Lápiz táctil', quantity: 2, unitPrice: 15 },
    ],
  },
  {
    id: 1007,
    status: 'anulada',
    issuer: { name: 'Ferretería El Sol', taxId: '20333444555' },
    client: { name: 'Distribuciones Ramírez', contact: 'Calle 9 #45-67, Bogotá' },
    invoiceNumber: 'F-007',
    date: '2026-07-30',
    items: [
      { id: 9012, description: 'Taladro inalámbrico', quantity: 1, unitPrice: 85 },
    ],
  },
  {
    id: 1008,
    status: 'emitida',
    issuer: { name: 'Distribuidora Norte S.R.L.', taxId: '20444555666' },
    client: { name: 'Sofía Castro', contact: 'sofia.castro@example.com' },
    invoiceNumber: 'F-008',
    date: '2026-09-06',
    items: [
      { id: 9013, description: 'Licuadora', quantity: 1, unitPrice: 55 },
      { id: 9014, description: 'Tostadora', quantity: 1, unitPrice: 35 },
    ],
  },
  {
    id: 1009,
    status: 'pagada',
    issuer: { name: 'TechStore S.A.', taxId: '20123456789' },
    client: { name: 'Juan Pérez', contact: 'juan.perez@example.com' },
    invoiceNumber: 'F-009',
    date: '2026-08-10',
    items: [
      { id: 9015, description: 'Teclado mecánico', quantity: 1, unitPrice: 50 },
      { id: 9016, description: 'Monitor 24"', quantity: 1, unitPrice: 180 },
      { id: 9017, description: 'Mouse inalámbrico', quantity: 2, unitPrice: 12 },
    ],
  },
  {
    id: 1010,
    status: 'anulada',
    issuer: { name: 'Importadora Pacífico S.A.', taxId: '20777888999' },
    client: { name: 'María López', contact: 'maria.lopez@example.com' },
    invoiceNumber: 'F-010',
    date: '2026-09-02',
    items: [
      { id: 9018, description: 'Impresora multifunción', quantity: 1, unitPrice: 250 },
      { id: 9019, description: 'Cartucho de tinta', quantity: 3, unitPrice: 20 },
    ],
  },
]

export default demoInvoices