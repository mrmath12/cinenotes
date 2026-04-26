'use client'

import Link from 'next/link'
import { ReactNode } from 'react'

type Variant = 'green' | 'purple' | 'gray'
type Size = 'sm' | 'md' | 'lg'

interface LiquidButtonProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  onClick?: () => void
  href?: string
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  fullWidth?: boolean
}

const wrapperVariant: Record<Variant, string> = {
  green:  'bg-gradient-to-br from-accent-400/60 via-accent-500/10 to-accent-500/30',
  purple: 'bg-gradient-to-br from-primary-400/60 via-primary-500/10 to-primary-500/30',
  gray:   'bg-gradient-to-br from-white/40 via-white/5 to-white/20',
}

const innerVariant: Record<Variant, string> = {
  green:  'text-accent-400 hover:bg-accent-500/20 hover:text-accent-300',
  purple: 'text-primary-300 hover:bg-primary-500/20 hover:text-primary-200',
  gray:   'text-white hover:bg-white/15',
}

const sizeClass: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-8 py-4 text-lg',
}

export default function LiquidButton({
  children,
  variant = 'green',
  size = 'md',
  onClick,
  href,
  type = 'button',
  disabled = false,
  fullWidth = false,
}: LiquidButtonProps) {
  const wrapperClass = [
    'p-[1px] rounded-lg',
    wrapperVariant[variant],
    fullWidth ? 'w-full' : '',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
  ].join(' ')

  const innerClass = [
    'bg-white/10 backdrop-blur-xl backdrop-saturate-150 rounded-lg font-medium',
    'transition-all shadow-[inset_0_1px_1px_rgba(255,255,255,0.18)]',
    'flex items-center justify-center gap-2',
    innerVariant[variant],
    sizeClass[size],
    fullWidth ? 'w-full' : '',
    disabled ? 'cursor-not-allowed' : 'hover:scale-105 cursor-pointer',
  ].join(' ')

  if (href && !disabled) {
    return (
      <div className={wrapperClass}>
        <Link href={href} className={innerClass}>{children}</Link>
      </div>
    )
  }

  return (
    <div className={wrapperClass}>
      <button type={type} onClick={onClick} disabled={disabled} className={innerClass}>
        {children}
      </button>
    </div>
  )
}
