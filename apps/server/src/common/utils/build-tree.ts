/** 菜单和部门共享同一树形契约：按 sort 排序，叶节点不输出空 children。 */
export type TreeNode<T> = T & {
  id: number
  parentId: number | null
  children?: TreeNode<T>[]
}

/**
 * 通用树形结构构建器
 * @param list 扁平节点数组，需含 id、parentId、可选 sort
 * @returns 树形数组（根节点在第一层），按 sort 升序，叶子节点不含 children 字段
 * @remarks
 * - 两次遍历：先建 Map，再按 parentId 挂载 children
 * - 最后递归清理：排序 + 叶子节点删除空 children 数组
 * - 复用于菜单/部门两个聚合
 */
export function buildTree<T extends {
  id: number
  parentId: number | null
  sort?: number
}>(list: T[],
) {
  const map = new Map<number, TreeNode<T>>()
  const roots: TreeNode<T>[] = []

  list.forEach(item => map.set(item.id, {
    ...item,
    children: [],
  }))
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)?.children?.push(item)
    }
    else {
      roots.push(item)
    }
  })

  const clean = (items: TreeNode<T>[]) =>
    items
      .sort((a, b) => (a.sort || 0) - (b.sort || 0))
      .map((item) => {
        if (item.children?.length) {
          item.children = clean(item.children)
        }
        else {
          delete item.children
        }
        return item
      })

  return clean(roots)
}
