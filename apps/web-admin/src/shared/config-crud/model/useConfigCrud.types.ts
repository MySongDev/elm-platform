export type CrudId = string | number

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
  Id extends CrudId = number,
> {
  getDefaultQuery: () => Query
  getDefaultForm: () => Form
  fetchList: () => Promise<Row[]>
  createItem: (payload: any) => Promise<unknown>
  updateItem: (id: Id, payload: any) => Promise<unknown>
  deleteItem: (id: Id) => Promise<unknown>
  getFormId: (form: Form) => Id | 0 | '' | null | undefined
  getRowId: (row: Row) => Id
  filterItem?: (row: Row, query: Query) => boolean
  filterList?: (rows: Row[], query: Query) => Row[]
  toForm?: (row: Row) => Partial<Form>
  toPayload?: (form: Form) => unknown
  deleteConfirm: (row: Row) => string
  saveSuccessMessage?: SaveSuccessMessage<Form, Id>
  deleteSuccessMessage?: string
}
