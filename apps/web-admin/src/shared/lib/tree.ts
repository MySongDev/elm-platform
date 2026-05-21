/**
 * @file 通用树结构工具
 * @domain shared/lib
 * @description 提供只依赖 children 约定的树遍历和过滤工具，供菜单、组织结构等树形数据复用。
 */

export interface TreeNode {
  children?: TreeNode[]
}

/**
 * @description 按前序遍历展开树结构；返回结果保留原节点引用，适合只读展示和查找场景。
 * @param items 待展开的树节点数组。
 * @returns 前序排列的扁平节点数组。
 * @performance O(n)，递归访问每个节点一次。
 */
export function flattenTree<T extends TreeNode>(items: T[]): T[] {
  return items.flatMap(item => [item, ...((item.children as T[] | undefined) ? flattenTree(item.children as T[]) : [])])
}

/**
 * @description 过滤树结构并保留命中后代的祖先节点；返回浅拷贝节点，避免修改原始树。
 * @param items 待过滤的树节点数组。
 * @param predicate 节点保留条件。
 * @returns 过滤后的树节点数组。
 * @performance O(n)，递归访问每个节点一次。
 */
export function filterTree<T extends TreeNode>(
  items: T[],
  predicate: (item: T) => boolean,
): T[] {
  return items
    .map((item) => {
      const children = item.children ? filterTree(item.children as T[], predicate) : []
      if (predicate(item) || children.length)
        return { ...item, children: children.length ? children : item.children }
      return null
    })
    .filter(Boolean) as T[]
}
