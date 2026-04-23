export function censorUsername(username: string): string {
  if (username.length <= 2) return username
  return username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
}
