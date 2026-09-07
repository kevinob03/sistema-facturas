export const HACIENDA_LOOKUP_URL = 'https://api.hacienda.go.cr/fe/ae'

export const cleanIdentificacion = (value) => String(value).replace(/[\s-]/g, '')

export const lookupByIdentificacion = async (identificacion) => {
  const clean = cleanIdentificacion(identificacion)
  if (!clean) throw new Error('La identificación no puede estar vacía')

  const url = `${HACIENDA_LOOKUP_URL}?identificacion=${encodeURIComponent(clean)}`
  const res = await fetch(url)

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('No se encontró un contribuyente con esa identificación')
    }
    throw new Error(`Error ${res.status} al consultar Hacienda`)
  }

  return res.json()
}

export const tipoIdentificacionLabel = (tipo) => {
  const labels = {
    '01': 'Persona Física',
    '02': 'Persona Jurídica',
    '03': 'DIMEX',
    '04': 'Extranjero',
  }
  return labels[tipo] || `Tipo ${tipo}`
}