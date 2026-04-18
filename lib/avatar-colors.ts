export const AVATAR_COLORS = [
  '#7C3AED', // violet-600
  '#DB2777', // pink-600
  '#2563EB', // blue-600
  '#059669', // emerald-600
  '#D97706', // amber-600
  '#DC2626', // red-600
]

export function getRandomAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('')
}
