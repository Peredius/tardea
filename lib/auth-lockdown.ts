export function isAuthLockdownEnabled() {
  return (
    process.env.AUTH_LOCKDOWN_ENABLED === 'true' ||
    Boolean(process.env.AUTH_ALLOWED_EMAILS?.trim())
  )
}

export function isAllowedAuthEmail(email?: string | null) {
  if (!isAuthLockdownEnabled()) return true
  if (!email) return false

  const allowedEmails = (process.env.AUTH_ALLOWED_EMAILS || '')
    .split(/[\n,;]/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowedEmails.includes(email.trim().toLowerCase())
}

