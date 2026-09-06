import type {
  SecurityLogQuery,
  SecurityLogResult,
  UpdateProfileParams,
  UserMenuNode,
} from '../model/types'
import type { UserInfo } from '@/entities/user'
import type { ApiRequestBody, ApiResponseData } from '@/shared/api/openapi'

export type LoginCredentials = ApiRequestBody<'/api/auth/login', 'post'>
export type LoginResult = ApiResponseData<'/api/auth/login', 'post'>

export interface SessionApi {
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  logout: () => Promise<void>
  getCurrentUser: () => Promise<UserInfo>
  getUserMenus: () => Promise<UserMenuNode[]>
  updateProfile: (data: UpdateProfileParams) => Promise<UserInfo>
  getSecurityLogs: (params: SecurityLogQuery) => Promise<SecurityLogResult>
}
