import { getStore, setStore } from './storage'

const LOG_KEY = '__app_error_logs__'
const MAX_LOGS = 20
const MAX_FIELD_LENGTH = 8000

function safeParseJson(text, fallback) {
  try {
    return JSON.parse(text)
  }
  catch {
    return fallback
  }
}

function truncateText(text, maxLen = MAX_FIELD_LENGTH) {
  if (typeof text !== 'string')
    return text
  if (text.length <= maxLen)
    return text
  return `${text.slice(0, maxLen)}...[truncated]`
}

function safeStringify(value) {
  try {
    return JSON.stringify(value)
  }
  catch {
    return '[unserializable]'
  }
}

function normalizeEntry(entry = {}) {
  return Object.fromEntries(
    Object.entries(entry).map(([key, value]) => {
      if (typeof value === 'string')
        return [key, truncateText(value)]

      if (value instanceof Error) {
        return [
          key,
          {
            name: value.name,
            message: value.message,
            stack: truncateText(value.stack),
          },
        ]
      }

      return [key, value]
    }),
  )
}

export function addErrorLog(entry) {
  if (typeof window === 'undefined')
    return

  const now = Date.now()
  const listText = getStore(LOG_KEY)
  const list = Array.isArray(listText) ? listText : safeParseJson(listText || '[]', [])
  const normalizedEntry = normalizeEntry(entry)

  const record = {
    ...normalizedEntry,
    ts: now,
    dateTime: new Date(now).toISOString(),
    pageUrl: window.location.href,
    userAgent: window.navigator.userAgent,
    params: normalizedEntry?.params
      ? truncateText(safeStringify(normalizedEntry.params))
      : undefined,
  }

  const endpoint = import.meta?.env?.VITE_LOG_ENDPOINT
  if (endpoint) {
    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
        keepalive: true,
      }).catch(() => {})
    }
    catch {}
  }

  list.unshift(record)

  const limited = list.slice(0, MAX_LOGS)
  setStore(LOG_KEY, limited)
}
