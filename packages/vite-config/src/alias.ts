import { fileURLToPath, URL } from 'node:url'

export function createSrcAlias(importMetaUrl: string) {
  return {
    '@': fileURLToPath(new URL('./src', importMetaUrl)),
  }
}
