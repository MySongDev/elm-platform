export interface MenuItem {
  id: number
  parentId: number | null
  title: string
  path: string
  name: string | null
  icon: string | null
  permission: string | null
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: number
  children?: MenuItem[]
}
