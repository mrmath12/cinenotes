'use client'

import LiquidButton from './LiquidButton'

interface NovaAvaliacaoButtonProps {
  onClick: () => void
}

export default function NovaAvaliacaoButton({ onClick }: NovaAvaliacaoButtonProps) {
  return <LiquidButton variant="green" onClick={onClick}>+ Nova Avaliação</LiquidButton>
}
