export interface LoginLogView {
  id: number
  userId: number
  username: string
  ip: string | null
  address: string | null
  browser: string | null
  os: string | null
  status: number
  message: string | null
  createdAt: Date
}
