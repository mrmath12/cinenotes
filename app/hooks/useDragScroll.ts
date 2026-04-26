import { useCallback, useRef } from 'react'

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const scrollLeft = useRef(0)
  const hasMoved = useRef(false)

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    const el = ref.current
    if (!el) return
    isDragging.current = true
    hasMoved.current = false
    startX.current = e.clientX
    scrollLeft.current = el.scrollLeft
    el.setPointerCapture(e.pointerId)
    el.style.cursor = 'grabbing'
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || !ref.current) return
    const delta = e.clientX - startX.current
    if (Math.abs(delta) > 5) hasMoved.current = true
    ref.current.scrollLeft = scrollLeft.current - delta
  }, [])

  const onPointerUp = useCallback(() => {
    isDragging.current = false
    if (ref.current) ref.current.style.cursor = 'grab'
  }, [])

  // Prevents child clicks from firing after a drag (capture phase fires before child onClick)
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (hasMoved.current) {
      e.stopPropagation()
      e.preventDefault()
      hasMoved.current = false
    }
  }, [])

  return { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture }
}
