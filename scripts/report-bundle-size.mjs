import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative } from 'node:path'
import { gzipSync } from 'node:zlib'

const apps = [
  {
    distDir: join('apps', 'web-admin', 'dist'),
    name: 'web-admin',
  },
  {
    distDir: join('apps', 'web-user', 'dist'),
    name: 'web-user',
  },
]

const trackedExtensions = new Set(['.css', '.js'])

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  const kib = bytes / 1024
  if (kib < 1024) {
    return `${kib.toFixed(1)} KiB`
  }

  return `${(kib / 1024).toFixed(2)} MiB`
}

async function collectAssets(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const assets = []

  for (const entry of entries) {
    const absolutePath = join(dir, entry.name)

    if (entry.isDirectory()) {
      assets.push(...await collectAssets(absolutePath))
      continue
    }

    if (!entry.isFile() || !trackedExtensions.has(extname(entry.name))) {
      continue
    }

    const file = await stat(absolutePath)
    const content = await readFile(absolutePath)

    assets.push({
      path: absolutePath,
      size: file.size,
      gzipSize: gzipSync(content).byteLength,
    })
  }

  return assets
}

function summarizeAssets(app, assets) {
  const totals = assets.reduce((summary, asset) => {
    summary.size += asset.size
    summary.gzipSize += asset.gzipSize
    return summary
  }, {
    gzipSize: 0,
    size: 0,
  })

  const largest = [...assets]
    .sort((a, b) => b.size - a.size)
    .slice(0, 5)

  console.log(`\n${app.name}`)
  console.log(`  files: ${assets.length}`)
  console.log(`  total: ${formatBytes(totals.size)} (${formatBytes(totals.gzipSize)} gzip)`)

  for (const asset of largest) {
    console.log(`  ${formatBytes(asset.size).padStart(10)} ${formatBytes(asset.gzipSize).padStart(10)} gzip  ${relative(app.distDir, asset.path)}`)
  }
}

for (const app of apps) {
  try {
    const assets = await collectAssets(app.distDir)
    summarizeAssets(app, assets)
  }
  catch (error) {
    console.error(`\n${app.name}`)
    console.error(`  Unable to read ${app.distDir}: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
