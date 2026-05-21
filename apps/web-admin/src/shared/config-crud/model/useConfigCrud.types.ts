import type { ConfigCrudFeedback } from './feedback'

export type CrudId = string | number

export interface PaginatedResult<T> {
  list: T[]
  total: number
}

export interface PaginationState {
  page: number
  pageSize: number
  total: number
}

export interface UseConfigCrudOptions<
  Row,
  Query extends Record<string, any>,
  Form extends Record<string, any>,
  Payload,
  Id extends CrudId = number,
> {
  getDefaultQuery: () => Query
  getDefaultForm: () => Form
  fetchList: (params?: { page: number, pageSize: number, query: Query }) => Promise<Row[] | PaginatedResult<Row>>
  createItem: (payload: Payload) => Promise<unknown>
  updateItem: (id: Id, payload: Payload) => Promise<unknown>
  deleteItem: (id: Id) => Promise<unknown>
  getFormId: (form: Form) => Id | 0 | '' | null | undefined
  getRowId: (row: Row) => Id
  pagination?: { defaultPageSize?: number }
  filterItem?: (row: Row, query: Query) => boolean
  filterList?: (rows: Row[], query: Query) => Row[]
  toForm?: (row: Row) => Partial<Form>
  toPayload?: (form: Form) => Payload
  deleteConfirm: (row: Row) => string
  saveSuccessMessage?: string
  deleteSuccessMessage?: string
  feedback?: ConfigCrudFeedback
}
