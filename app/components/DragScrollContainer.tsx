'use client'

import { useDragScroll } from '../hooks/useDragScroll'

interface DragScrollContainerProps {
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export default function DragScrollContainer({ children, className, style }: DragScrollContainerProps) {
  const { ref, onPointerDown, onClickCapture } = useDragScroll<HTMLDivElement>()

  return (
    <div
      ref={ref}
      className={className}
      style={{ cursor: 'grab', ...style }}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
    >
      {children}
    </div>
  )
}
