'use client'

import { getInitials } from '../../lib/avatar-colors'

interface AvatarProps {
  fullName: string
  avatarColor: string
  size?: 'sm' | 'md'
}

export default function Avatar({ fullName, avatarColor, size = 'md' }: AvatarProps) {
  const initials = getInitials(fullName)
  const dimension = size === 'sm' ? '32px' : '40px'
  const fontSize = size === 'sm' ? '12px' : '14px'

  return (
    <div
      style={{
        width: dimension,
        height: dimension,
        backgroundColor: avatarColor,
        fontSize,
      }}
      className="rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0 select-none"
    >
      {initials}
    </div>
  )
}
