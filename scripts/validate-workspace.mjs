/**
 * Validates pnpm workspace package metadata for Monorepo hygiene.
 *
 * Checks:
 * 1. Every workspace package declares a unique "name".
 * 2. Internal dependencies use the "workspace:*" protocol.
 * 3. Packages under packages/* do not depend on apps under apps/*.
 * 4. Apps do not depend on other apps.
 * 5. Packages that expose "dist" outputs declare a "build" script.
 *
 * Generated packages (for example @elm-platform/api-types) expose
 * "generated" instead of "dist", so they are not required to build here.
 */
import { readdir, readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspaceGroups = [
  {
    dir: 'apps',
    type: 'app',
  },
  {
    dir: 'packages',
    type: 'package',
  },
]
const dependencyFields = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
]

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'))
}

async function collectWorkspacePackages() {
  const packages = []

  for (const group of workspaceGroups) {
    const groupDir = join(rootDir, group.dir)
    let entries

    try {
      entries = await readdir(groupDir, { withFileTypes: true })
    }
    catch {
      continue
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue
      }

      const manifestPath = join(groupDir, entry.name, 'package.json')
      let manifest

      try {
        manifest = await readJson(manifestPath)
      }
      catch {
        continue
      }

      packages.push({
        dir: join(group.dir, entry.name),
        manifest,
        manifestPath,
        type: group.type,
      })
    }
  }

  return packages
}

function exposesDist(manifest) {
  const candidates = []

  if (typeof manifest.main === 'string') {
    candidates.push(manifest.main)
  }
  if (typeof manifest.module === 'string') {
    candidates.push(manifest.module)
  }
  if (typeof manifest.types === 'string') {
    candidates.push(manifest.types)
  }
  if (manifest.exports) {
    candidates.push(JSON.stringify(manifest.exports))
  }
  if (Array.isArray(manifest.files)) {
    candidates.push(...manifest.files)
  }

  return candidates.some(value => value.includes('dist'))
}

async function main() {
  const packages = await collectWorkspacePackages()
  const errors = []

  const nameToDir = new Map()
  const internalNames = new Set()
  const appNames = new Set()

  for (const pkg of packages) {
    const name = pkg.manifest.name

    if (!name) {
      errors.push(`${pkg.dir}/package.json is missing a "name" field.`)
      continue
    }

    if (nameToDir.has(name)) {
      errors.push(`Duplicate package name "${name}" in ${pkg.dir} and ${nameToDir.get(name)}.`)
    }
    else {
      nameToDir.set(name, pkg.dir)
    }

    internalNames.add(name)
    if (pkg.type === 'app') {
      appNames.add(name)
    }
  }

  for (const pkg of packages) {
    const relativeManifest = relative(rootDir, pkg.manifestPath).replace(/\\/g, '/')

    for (const field of dependencyFields) {
      const deps = pkg.manifest[field]
      if (!deps) {
        continue
      }

      for (const [depName, depRange] of Object.entries(deps)) {
        if (!internalNames.has(depName)) {
          continue
        }

        if (depRange !== 'workspace:*') {
          errors.push(`${relativeManifest}: internal dependency "${depName}" must use "workspace:*", found "${depRange}".`)
        }

        if (pkg.type === 'package' && appNames.has(depName)) {
          errors.push(`${relativeManifest}: package must not depend on app "${depName}".`)
        }

        if (pkg.type === 'app' && appNames.has(depName) && depName !== pkg.manifest.name) {
          errors.push(`${relativeManifest}: app must not depend on another app "${depName}".`)
        }
      }
    }

    if (pkg.type === 'package' && exposesDist(pkg.manifest)) {
      const hasBuild = Boolean(pkg.manifest.scripts && pkg.manifest.scripts.build)
      if (!hasBuild) {
        errors.push(`${relativeManifest}: package exposes "dist" output but has no "build" script.`)
      }
    }
  }

  if (errors.length > 0) {
    console.error('Workspace validation failed:')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    process.exit(1)
  }

  console.log(`Workspace validation passed for ${packages.length} packages.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
