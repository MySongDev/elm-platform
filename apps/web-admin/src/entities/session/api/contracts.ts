import type { paths } from '@elm-platform/api-types'
import type {
  SecurityLogQuery,
  SecurityLogResult,
  UpdateProfileParams,
  UserMenuNode,
} from '../model/types'
import type { UserInfo } from '@/entities/user'

type ApiEnvelopeData<T> = T extends { data: infer Data } ? Data : never
type LoginOperation = paths['/api/auth/login']['post']
type LoginResponseBody = LoginOperation['responses'][200]['content']['application/json']

export type LoginCredentials = LoginOperation['requestBody']['content']['application/json']
export type LoginResult = ApiEnvelopeData<LoginResponseBody>

export interface SessionApi {
  login: (credentials: LoginCredentials) => Promise<LoginResult>
  getCurrentUser: () => Promise<UserInfo>
  getUserMenus: () => Promise<UserMenuNode[]>
  updateProfile: (data: UpdateProfileParams) => Promise<UserInfo>
  getSecurityLogs: (params: SecurityLogQuery) => Promise<SecurityLogResult>
}
