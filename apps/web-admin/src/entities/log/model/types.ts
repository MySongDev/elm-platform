export interface LoginLog {
  id: number
  username: string
  ip: string | null
  address: string | null
  browser: string | null
  os: string | null
  status: number
  message: string | null
  createdAt: string
}

export interface OperationLog {
  id: number
  username: string
  module: string
  action: string
  method: string
  path: string
  ip: string | null
  status: number
  duration: number
  createdAt: string
}

export interface SystemLog {
  id: number
  level: 'info' | 'warn' | 'error'
  source: string
  message: string
  detail: string | null
  createdAt: string
}
