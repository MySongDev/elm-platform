import * as fs from 'node:fs'
import * as path from 'node:path'
import * as ts from 'typescript'
import { fallbackMenus } from './constants/admin-fallback-data'
import { buttonPermissions, pagePermissions } from './constants/admin-permissions'

interface MenuSeedRecord {
  id: number
  parentId?: number | null
  title: string
  path: string
  name?: string | null
  icon?: string | null
  permission?: string | null
  type: 'catalog' | 'menu' | 'button'
  sort: number
  status: number
}

function readSeedSource() {
  return fs.readFileSync(path.resolve(__dirname, '../../../prisma/seed.ts'), 'utf8')
}

function propName(name: ts.PropertyName): string | undefined {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name))
    return name.text

  return undefined
}

function literalValue(node: ts.Expression): unknown {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node))
    return node.text

  if (ts.isNumericLiteral(node))
    return Number(node.text)

  if (node.kind === ts.SyntaxKind.NullKeyword)
    return null

  if (ts.isArrayLiteralExpression(node))
    return node.elements.map(element => literalValue(element as ts.Expression))

  if (ts.isObjectLiteralExpression(node))
    return objectValue(node)

  return undefined
}

function objectValue(node: ts.ObjectLiteralExpression): Record<string, unknown> {
  return node.properties.reduce<Record<string, unknown>>((result, property) => {
    if (!ts.isPropertyAssignment(property))
      return result

    const key = propName(property.name)
    if (!key)
      return result

    result[key] = literalValue(property.initializer)
    return result
  }, {})
}

function extractMenuSeeds(source: string): MenuSeedRecord[] {
  const sourceFile = ts.createSourceFile('seed.ts', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  let menuSeeds: MenuSeedRecord[] | null = null

  function visit(node: ts.Node) {
    if (
      ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.name.text === 'menuSeeds'
      && node.initializer
      && ts.isArrayLiteralExpression(node.initializer)
    ) {
      menuSeeds = node.initializer.elements.map(element => objectValue(element as ts.ObjectLiteralExpression) as unknown as MenuSeedRecord)
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (!menuSeeds)
    throw new Error('menuSeeds not found in prisma seed')

  return menuSeeds
}

function normalizeMenu(menu: MenuSeedRecord) {
  return {
    id: menu.id,
    parentId: menu.parentId ?? null,
    title: menu.title,
    path: menu.path,
    name: menu.name ?? null,
    icon: menu.icon ?? null,
    permission: menu.permission ?? null,
    type: menu.type,
    sort: menu.sort,
    status: menu.status,
  }
}

function menuPages(menus: MenuSeedRecord[]) {
  return menus
    .filter(menu => menu.type === 'menu' && menu.status === 1)
    .map(normalizeMenu)
}

function listIndexVueFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory())
      return listIndexVueFiles(fullPath)

    return entry.isFile() && entry.name === 'index.vue' ? [fullPath] : []
  })
}

function readAdminPageComponentKeys() {
  const pagesRoot = path.resolve(__dirname, '../../../../web-admin/src/pages')

  return new Set(
    listIndexVueFiles(pagesRoot)
      .map(file => path.relative(pagesRoot, file).replace(/\\/g, '/').replace(/\/index\.vue$/, '')),
  )
}

function resolveFreshMenuComponentKey(menuPath: string) {
  const aliases: Record<string, string> = {
    'monitor/online-user': 'monitor/online',
    'monitor/login-logs': 'monitor/logs/login',
    'monitor/operation-logs': 'monitor/logs/operation',
    'monitor/system-logs': 'monitor/logs/system',
  }
  const key = menuPath
    .replace(/^\/+|\/+$/g, '')
    .replace(/\/index(?:\.vue)?$/, '')
    .replace(/\.vue$/, '')

  return aliases[key] ?? key
}

describe('admin menu protocol', () => {
  it('keeps Prisma seed menus aligned with fallback menus', () => {
    const seedMenus = extractMenuSeeds(readSeedSource()).map(normalizeMenu)

    expect(seedMenus).toEqual(fallbackMenus.map(normalizeMenu))
  })

  it('keeps page permission route names aligned with fresh menu data', () => {
    const pagesByPath = new Map(pagePermissions.map(permission => [permission.path, permission]))

    for (const menu of menuPages(fallbackMenus)) {
      const pagePermission = pagesByPath.get(menu.path)

      expect(pagePermission).toBeDefined()
      expect(pagePermission?.name).toBe(menu.name)
      expect(pagePermission?.auths ?? []).toEqual(menu.permission ? [menu.permission] : [])
    }
  })

  it('declares every menu permission in permission constants', () => {
    const permissionCodes = new Set(buttonPermissions.map(permission => permission.code))
    const menuPermissions = fallbackMenus
      .map(menu => menu.permission)
      .filter((permission): permission is string => Boolean(permission))

    expect(menuPermissions.filter(permission => !permissionCodes.has(permission))).toEqual([])
  })

  it('maps every fresh menu page to an admin page component', () => {
    const componentKeys = readAdminPageComponentKeys()
    const missingComponents = menuPages(fallbackMenus)
      .map(menu => ({
        path: menu.path,
        componentKey: resolveFreshMenuComponentKey(menu.path),
      }))
      .filter(menu => !componentKeys.has(menu.componentKey))

    expect(missingComponents).toEqual([])
  })
})
