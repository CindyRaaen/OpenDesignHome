/**
 * Shop API utility — calls the Open Shop server on port 3015
 * Uses the same JWT token as the OID app (shared JWT_SECRET across all OpenScaffold apps)
 */

import { getToken } from './api'

const SHOP_BASE = 'http://localhost:3015'

const getHeaders = () => {
  const token = getToken()
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  }
}

const request = async (method, path, data = null) => {
  const url = `${SHOP_BASE}${path}`
  const options = {
    method,
    headers: getHeaders(),
  }

  if (data) {
    options.body = JSON.stringify(data)
  }

  let response
  try {
    response = await fetch(url, options)
  } catch (networkError) {
    console.error(`[ShopAPI] Network error on ${method} ${path}:`, networkError.message)
    const err = new Error(`Open Shop server not reachable — is it running on port 3015?`)
    err.status = 0
    throw err
  }

  if (!response.ok) {
    let message = `Shop API Error: ${response.status}`
    try {
      const body = await response.json()
      if (body.error) message = body.error
    } catch (_) {}
    const error = new Error(message)
    error.status = response.status
    throw error
  }

  if (response.status === 204) return null
  return response.json()
}

export const shopApi = {
  get: (path) => request('GET', path),
  post: (path, data) => request('POST', path, data),
  put: (path, data) => request('PUT', path, data),
  patch: (path, data) => request('PATCH', path, data),
  delete: (path) => request('DELETE', path),
}
