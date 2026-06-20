import type {
  SecurityLogResult,
  UserMenuNode,
} from '../model/types'
import type {
  LoginResult,
  SessionApi,
} from './contracts'
import type { UserInfo } from '@/entities/user'
import { authEndpoints } from '@/shared/api/endpoints'
import request from '@/shared/api/request'

export const realSessionApi: SessionApi = {
  login: credentials => request.post<LoginResult>(authEndpoints.login, credentials),
  getCurrentUser: () => request.get<UserInfo>(authEndpoints.profile),
  getUserMenus: () => request.get<UserMenuNode[]>(authEndpoints.menus),
  updateProfile: data => request.patch<UserInfo>(authEndpoints.profile, data),
  getSecurityLogs: params => request.get<SecurityLogResult>(authEndpoints.securityLogs, { params }),
}
