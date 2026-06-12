/**
 * @file 后端菜单协议校验与归一化
 * @domain router
 * @description 在菜单进入路由适配层前做结构校验和无效节点过滤，避免异常后端数据破坏动态路由注册。
 */

import type { BackendMenuNode } from '../build-routes'

export type MenuValidationSeverity = 'error' | 'warning'

export interface MenuValidationIssue {
  severity: MenuValidationSeverity
  location: string
  field: string
  message: string
}

interface ValidationContext {
  seenNames: Set<string>
}

const MENU_TYPES = new Set(['catalog', 'menu'])

/**
 * @description 校验未知菜单载荷并返回结构问题；该函数不抛错，调用方可决定是降级、过滤还是仅在开发环境提示。
 * @param menus 后端返回的未知菜单载荷。
 * @returns 菜单结构问题列表，空数组表示当前校验规则下没有发现问题。
 * @performance O(n)，递归访问每个菜单节点一次，并用 Set 检查重复 route name。
 */
export function validateMenuTree(menus: unknown): MenuValidationIssue[] {
  const issues: MenuValidationIssue[] = []

  if (!Array.isArray(menus)) {
    issues.push({
      severity: 'error',
      location: 'menus',
      field: 'root',
      message: 'Menu payload must be an array.',
    })
    return issues
  }

  validateMenuNodes(menus, 'menus', issues, { seenNames: new Set() })
  return issues
}

/**
 * @description 过滤无法安全参与路由构建的菜单节点；title 允许为空白字符串，因为标题 fallback 由适配层负责。
 * @param menus 已知为后端菜单形状的菜单树。
 * @returns 归一化后的后端菜单树，无效节点会被移除。
 * @performance O(n)，递归访问每个菜单节点一次。
 */
export function normalizeMenuTree(menus: BackendMenuNode[]): BackendMenuNode[] {
  const issues = validateMenuTree(menus)
  reportMenuValidationIssues(issues)

  return menus
    .map(menu => normalizeMenuNode(menu))
    .filter((menu): menu is BackendMenuNode => menu !== null)
}

function normalizeMenuNode(menu: BackendMenuNode): BackendMenuNode | null {
  if (!isValidMenuNode(menu))
    return null

  return {
    ...menu,
    children: Array.isArray(menu.children)
      ? menu.children
          .map(child => normalizeMenuNode(child))
          .filter((child): child is BackendMenuNode => child !== null)
      : undefined,
  }
}

function validateMenuNodes(
  menus: unknown[],
  location: string,
  issues: MenuValidationIssue[],
  context: ValidationContext,
) {
  menus.forEach((menu, index) => {
    const nodeLocation = `${location}[${index}]`
    validateMenuNode(menu, nodeLocation, issues, context)
  })
}

function validateMenuNode(
  menu: unknown,
  location: string,
  issues: MenuValidationIssue[],
  context: ValidationContext,
) {
  if (!isRecord(menu)) {
    issues.push({
      severity: 'error',
      location,
      field: 'node',
      message: 'Menu node must be an object.',
    })
    return
  }

  validateOptionalString(menu, 'title', location, issues)
  validateRequiredString(menu, 'path', location, issues)
  validateNullableString(menu, 'name', location, issues)
  validateNullableString(menu, 'icon', location, issues)
  validateNullableString(menu, 'permission', location, issues)
  validateNullableString(menu, 'component', location, issues)

  if (!MENU_TYPES.has(String(menu.type))) {
    issues.push({
      severity: 'error',
      location,
      field: 'type',
      message: 'Menu type must be "catalog" or "menu".',
    })
  }

  if (!Number.isFinite(menu.sort)) {
    issues.push({
      severity: 'error',
      location,
      field: 'sort',
      message: 'Menu sort must be a finite number.',
    })
  }

  if (!Number.isFinite(menu.status)) {
    issues.push({
      severity: 'error',
      location,
      field: 'status',
      message: 'Menu status must be a finite number.',
    })
  }

  if (typeof menu.name === 'string' && menu.name) {
    if (context.seenNames.has(menu.name)) {
      issues.push({
        severity: 'warning',
        location,
        field: 'name',
        message: `Duplicate route name "${menu.name}" may cause router warnings.`,
      })
    }
    context.seenNames.add(menu.name)
  }

  if ('children' in menu && menu.children !== undefined && !Array.isArray(menu.children)) {
    issues.push({
      severity: 'error',
      location,
      field: 'children',
      message: 'Menu children must be an array when provided.',
    })
    return
  }

  if (Array.isArray(menu.children))
    validateMenuNodes(menu.children, `${location}.children`, issues, context)
}

function reportMenuValidationIssues(issues: MenuValidationIssue[]) {
  if (!issues.length || !import.meta.env.DEV)
    return

  console.warn('[router] Menu schema validation issues:', issues)
}

function validateRequiredString(
  menu: Record<string, unknown>,
  field: string,
  location: string,
  issues: MenuValidationIssue[],
) {
  if (typeof menu[field] !== 'string' || !menu[field]) {
    issues.push({
      severity: 'error',
      location,
      field,
      message: `Menu ${field} must be a non-empty string.`,
    })
  }
}

function validateOptionalString(
  menu: Record<string, unknown>,
  field: string,
  location: string,
  issues: MenuValidationIssue[],
) {
  if (menu[field] !== undefined && typeof menu[field] !== 'string') {
    issues.push({
      severity: 'error',
      location,
      field,
      message: `Menu ${field} must be a string when provided.`,
    })
  }
}

function validateNullableString(
  menu: Record<string, unknown>,
  field: string,
  location: string,
  issues: MenuValidationIssue[],
) {
  if (menu[field] !== null && menu[field] !== undefined && typeof menu[field] !== 'string') {
    issues.push({
      severity: 'error',
      location,
      field,
      message: `Menu ${field} must be a string or null.`,
    })
  }
}

function isValidMenuNode(menu: BackendMenuNode): boolean {
  return isRecord(menu)
    && (menu.title === undefined || typeof menu.title === 'string')
    && typeof menu.path === 'string'
    && !!menu.path
    && MENU_TYPES.has(menu.type)
    && Number.isFinite(menu.sort)
    && Number.isFinite(menu.status)
    && isNullableString(menu.name)
    && isNullableString(menu.icon)
    && isNullableString(menu.permission)
    && isNullableString(menu.component)
    && (menu.children === undefined || Array.isArray(menu.children))
}

function isNullableString(value: unknown): value is string | null | undefined {
  return value === null || value === undefined || typeof value === 'string'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
