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

export interface SaveSuccessMessageContext<
  Form,
  Id extends CrudId = number,
> {
  form: Form
  id: Id | 0 | '' | null | undefined
  isEdit: boolean
}

export type SaveSuccessMessage<
  Form,
  Id extends CrudId = number,
> = string | ((context: SaveSuccessMessageContext<Form, Id>) => string)

export interface UseConfigCrudOptions<
  Row,
  Query extends object,
  Form extends object,
  Payload,
  Id extends CrudId = number,
> {
  getDefaultQuery: () => Query
  getDefaultForm: () => Form
  fetchList: (params?: {
    page: number
    pageSize: number
    query: Query
  }) => Promise<Row[] | PaginatedResult<Row>>
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
  saveSuccessMessage?: SaveSuccessMessage<Form, Id>
  deleteSuccessMessage?: string
  feedback?: ConfigCrudFeedback
}
