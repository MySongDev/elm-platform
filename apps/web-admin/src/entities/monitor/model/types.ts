export interface OnlineUser {
  id: number
  username: string
  role: string
  ip: string | null
  browser: string | null
  os: string | null
  loginTime: string
  lastActiveAt: string
}
