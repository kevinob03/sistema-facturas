import AppIcon from './AppIcon'
function TourButton({ onClick, title = 'Iniciar recorrido guiado' }) {
  return (
    <button
      type="button"
      className="tour-btn"
      onClick={onClick}
      title={title}
      aria-label="Ver tutorial interactivo de esta pantalla"
    >
      <span className="tour-btn-icon"><AppIcon name="compass" size={15} /></span>
      <span className="tour-btn-text">Guía</span>
    </button>
  )
}

export default TourButton
