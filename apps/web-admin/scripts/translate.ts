/**
 * 自动翻译脚本
 * 用法: npx tsx scripts/translate.ts
 *
 * 原理: 读取 zh-CN.ts，对比 en.ts 中缺失的 key，
 * 调用翻译 API 补全，写回 en.ts。
 *
 * 如需接入真实 API，替换 translateText 函数即可。
 */
import fs from 'node:fs'
import path from 'node:path'

const zhPath = path.resolve(__dirname, '../src/locales/lang/zh-CN.ts')
const enPath = path.resolve(__dirname, '../src/locales/lang/en.ts')

function parseModule(filePath: string): Record<string, any> {
  const content = fs.readFileSync(filePath, 'utf-8')
  const jsonStr = content
    .replace(/^export default\s*/, '')
    .replace(/;?\s*$/, '')
    .replace(/(\w+):/g, '"$1":')
    .replace(/'/g, '"')
  return JSON.parse(jsonStr)
}

function flattenKeys(obj: Record<string, any>, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      keys.push(...flattenKeys(value, fullKey))
    }
    else {
      keys.push(fullKey)
    }
  }
  return keys
}

function getNestedValue(obj: any, keyPath: string): any {
  return keyPath.split('.').reduce((acc, key) => acc?.[key], obj)
}

function setNestedValue(obj: any, keyPath: string, value: any) {
  const keys = keyPath.split('.')
  let current = obj
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]])
      current[keys[i]] = {}
    current = current[keys[i]]
  }
  current[keys.at(-1)] = value
}

async function translateText(text: string): Promise<string> {
  // 方案 1: 调用 DeepL API
  // const res = await fetch('https://api-free.deepl.com/v2/translate', {
  //   method: 'POST',
  //   headers: { 'Authorization-Key': 'YOUR_KEY', 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ text: [text], target_lang: 'EN' }),
  // })
  // const data = await res.json()
  // return data.translations[0].text

  // 方案 2: 调用 Google Translate API
  // ...

  // 临时方案: 返回原文并标记
  return `[TODO] ${text}`
}

async function main() {
  const zh = parseModule(zhPath)
  const en = parseModule(enPath)

  const zhKeys = flattenKeys(zh)
  const missing = zhKeys.filter(key => getNestedValue(en, key) === undefined)

  if (missing.length === 0) {
    console.log('en.ts 已完整，无需翻译')
    return
  }

  console.log(`发现 ${missing.length} 个缺失的翻译 key:`)
  for (const key of missing) {
    const zhValue = getNestedValue(zh, key) as string
    const enValue = await translateText(zhValue)
    setNestedValue(en, key, enValue)
    console.log(`  ${key}: "${zhValue}" → "${enValue}"`)
  }

  const output = `export default ${JSON.stringify(en, null, 2)}\n`
  fs.writeFileSync(enPath, output, 'utf-8')
  console.log(`\n已写入 ${enPath}`)
}

main()
