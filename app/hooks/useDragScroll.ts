import { useCallback, useRef } from 'react'

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const hasMoved = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return

    hasMoved.current = false
    const startX = e.clientX
    const startScrollLeft = el.scrollLeft
    el.style.cursor = 'grabbing'

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - startX
      if (Math.abs(delta) > 5) hasMoved.current = true
      el.scrollLeft = startScrollLeft - delta
    }

    const onUp = () => {
      el.style.cursor = 'grab'
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  // Suppresses child clicks after a drag (capture phase fires before child onClick)
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.stopPropagation()
      e.preventDefault()
      hasMoved.current = false
    }
  }, [])

  return { ref, onPointerDown, onClickCapture }
}
