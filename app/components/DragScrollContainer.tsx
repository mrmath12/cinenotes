'use client'

import { useDragScroll } from '../hooks/useDragScroll'

interface DragScrollContainerProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function DragScrollContainer({ children, className, style }: DragScrollContainerProps) {
  const { ref, onPointerDown, onPointerMove, onPointerUp, onClickCapture } = useDragScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={className}
      style={{ cursor: 'grab', ...style }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  )
}
