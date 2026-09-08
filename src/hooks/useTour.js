import { useEffect, useRef, useCallback } from 'react'
import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { TOURS_CONFIG } from '../utils/toursConfig'

const STORAGE_PREFIX = 'tour_completed_'

/**
 * Hook reutilizable para tours guiados con Driver.js por módulo
 */
export function useTour({ activePage, autoStart = true, onStart }) {
  const driverInstanceRef = useRef(null)
  const timerRef = useRef(null)

  /**
   * Inicia el tour para el módulo indicado
   * @param {string} pageKey - Clave del módulo ('dashboard', 'new', 'list', 'detail')
   * @param {boolean} force - Si es true, inicia el tour aunque ya haya sido completado
   */
  const startTour = useCallback(
    (pageKey = activePage, force = false) => {
      const config = TOURS_CONFIG[pageKey]
      if (!config) return


      const storageKey = `${STORAGE_PREFIX}${pageKey}`
      const alreadyCompleted = typeof window !== 'undefined' ? localStorage.getItem(storageKey) === 'true' : false

      if (!force && alreadyCompleted) {
        return
      }

      onStart?.()

      // Si hay un tour en curso, detenerlo
      if (driverInstanceRef.current) {
        try {
          driverInstanceRef.current.destroy()
        } catch {
          // Ignorar error al destruir
        }
      }

      // Filtrar solo los pasos cuyos elementos existan en el DOM actual
      const availableSteps = config.steps.filter((step) => {
        if (!step.element) return true
        const el = document.querySelector(step.element)
        return el !== null && el.offsetParent !== null
      })

      if (availableSteps.length === 0) return

      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(15, 23, 42, 0.72)',
        nextBtnText: 'Siguiente →',
        prevBtnText: '← Anterior',
        doneBtnText: '¡Entendido! ',
        progressText: '{{current}} de {{total}}',
        popoverClass: 'factura-tour-popover',
        steps: availableSteps,
        onDestroyStarted: () => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(storageKey, 'true')
          }
          driverObj.destroy()
        },
      })

      driverInstanceRef.current = driverObj
      driverObj.drive()
    },
    [activePage, onStart],
  )

  // Auto-inicio en primera visita a cada módulo
  useEffect(() => {
    if (!autoStart || !activePage) return

    clearTimeout(timerRef.current)

    const storageKey = `${STORAGE_PREFIX}${activePage}`
    const alreadyCompleted = typeof window !== 'undefined' ? localStorage.getItem(storageKey) === 'true' : false

    if (!alreadyCompleted) {
      // Pequeño retardo para permitir que React termine de montar y renderizar los elementos del DOM
      timerRef.current = setTimeout(() => {
        startTour(activePage, false)
      }, 450)
    }

    return () => {
      clearTimeout(timerRef.current)
      if (driverInstanceRef.current) {
        try {
          driverInstanceRef.current.destroy()
        } catch {
          // Limpieza segura
        }
      }
    }
  }, [activePage, autoStart, startTour])

  return {
    startTour,
  }
}
