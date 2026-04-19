const TOKEN_KEY = 'odh_token'

async function request(path, opts = {}) {
  const token = localStorage.getItem(TOKEN_KEY)
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (token && token !== 'dev') headers['Authorization'] = `Bearer ${token}`
  
  const res = await fetch(path, { ...opts, headers })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e.error || res.statusText)
  }
  return res.json()
}

export const api = {
  get: (p) => request(p),
  post: (p, d) => request(p, { method: 'POST', body: JSON.stringify(d) }),
  patch: (p, d) => request(p, { method: 'PATCH', body: JSON.stringify(d) }),
  delete: (p) => request(p, { method: 'DELETE' }),
}
