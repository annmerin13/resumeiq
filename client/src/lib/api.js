// Use Vite proxy in dev (/api → localhost:5000). Set VITE_API_URL for production.
export const API_BASE = import.meta.env.VITE_API_URL ?? ''

export function authHeaders(json = false) {
  const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` }
  if (json) headers['Content-Type'] = 'application/json'
  return headers
}
