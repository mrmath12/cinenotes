'use client'

import { getInitials } from '../../lib/avatar-colors'

interface AvatarProps {
  fullName: string
  avatarColor: string
  size?: 'xs' | 'sm' | 'md'
}

export default function Avatar({ fullName, avatarColor, size = 'md' }: AvatarProps) {
  const initials = getInitials(fullName)
  const dimension = size === 'xs' ? '24px' : size === 'sm' ? '32px' : '40px'
  const fontSize = size === 'xs' ? '11px' : size === 'sm' ? '14px' : '16px'

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        borderColor: avatarColor,
        color: avatarColor,
        fontSize,
      }}
      className="rounded-full flex items-center justify-center font-semibold flex-shrink-0 select-none bg-white/5 border"
    >
      {initials}
    </div>
  )
}
