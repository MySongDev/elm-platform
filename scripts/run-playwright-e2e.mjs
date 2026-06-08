import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { Socket } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const isWindows = process.platform === 'win32'
const pnpmCommand = 'pnpm'
const playwrightCli = require.resolve('@playwright/test/cli')
const playwrightArgs = process.argv.slice(2)

const serverUrl = 'http://127.0.0.1:3000'
const adminUrl = 'http://127.0.0.1:5173'
const userUrl = 'http://127.0.0.1:5174'
const databaseUrl = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@127.0.0.1:5432/elm_dev?schema=public'
const redisHost = process.env.REDIS_HOST ?? '127.0.0.1'
const redisPort = Number(process.env.REDIS_PORT ?? '6379')

const services = [
  {
    name: 'server',
    readyUrl: `${serverUrl}/api-docs-json`,
    args: ['--filter', 'vue3-elm-node', 'run', 'start'],
    env: {
      APP_PORT: '3000',
      APP_PREFIX: 'api',
      DATABASE_URL: databaseUrl,
      REDIS_HOST: redisHost,
      REDIS_PORT: String(redisPort),
    },
  },
  {
    name: 'admin',
    readyUrl: adminUrl,
    args: ['--filter', 'elm-web-admin', 'exec', 'vite', '--host', '127.0.0.1', '--port', '5173', '--strictPort'],
  },
  {
    name: 'user',
    readyUrl: userUrl,
    args: ['--filter', 'vue3-elm-js', 'exec', 'vite', '--mode', 'mock', '--host', '127.0.0.1', '--port', '5174', '--strictPort'],
  },
]

const startedProcesses = []

function log(message) {
  process.stdout.write(`[e2e] ${message}\n`)
}

function parseDatabaseEndpoint() {
  const url = new URL(databaseUrl)
  return {
    host: url.hostname,
    name: 'Postgres',
    port: Number(url.port || '5432'),
  }
}

async function canConnect(host, port, timeoutMs = 1500) {
  return await new Promise((resolve) => {
    const socket = new Socket()
    const finish = (result) => {
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(timeoutMs)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.connect(port, host)
  })
}

async function verifyTcpDependency(dependency) {
  if (await canConnect(dependency.host, dependency.port)) {
    return
  }

  throw new Error(
    `${dependency.name} is not reachable at ${dependency.host}:${dependency.port}. `
    + 'Start local dependencies with "docker compose up -d postgres redis" or set DATABASE_URL/REDIS_HOST/REDIS_PORT.',
  )
}

async function verifyDependencies() {
  if (process.env.PLAYWRIGHT_SKIP_DEPENDENCY_CHECK === '1') {
    log('Skipping dependency preflight')
    return
  }

  await Promise.all([
    verifyTcpDependency(parseDatabaseEndpoint()),
    verifyTcpDependency({
      host: redisHost,
      name: 'Redis',
      port: redisPort,
    }),
  ])
}

function spawnProcess(name, args, options = {}) {
  const child = spawn(pnpmCommand, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      ...options.env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: isWindows,
    windowsHide: true,
  })

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[${name}] ${chunk}`)
  })
  child.stderr.on('data', (chunk) => {
    process.stderr.write(`[${name}] ${chunk}`)
  })

  return child
}

async function isReady(url) {
  try {
    const response = await fetch(url)
    return response.status < 500
  }
  catch {
    return false
  }
}

async function waitForReady(service, child) {
  const timeoutMs = 120_000
  const start = Date.now()

  while (Date.now() - start < timeoutMs) {
    if (await isReady(service.readyUrl)) {
      return
    }

    if (child?.exitCode !== null) {
      throw new Error(`${service.name} exited before ${service.readyUrl} became ready`)
    }

    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error(`${service.name} did not become ready at ${service.readyUrl}`)
}

async function killProcessTree(child) {
  if (!child.pid || child.exitCode !== null) {
    return
  }

  child.stdout?.destroy()
  child.stderr?.destroy()

  if (isWindows) {
    await new Promise((resolve) => {
      const killer = spawn('taskkill.exe', ['/PID', String(child.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      })
      const timeout = setTimeout(resolve, 10_000)
      killer.on('exit', () => {
        clearTimeout(timeout)
        resolve()
      })
      killer.on('error', () => {
        clearTimeout(timeout)
        resolve()
      })
    })
    child.kill()
    child.unref()
    return
  }

  child.kill('SIGTERM')
  await new Promise(resolve => setTimeout(resolve, 2_000))
  if (child.exitCode === null) {
    child.kill('SIGKILL')
  }
  child.unref()
}

async function runPlaywright() {
  return await new Promise((resolve) => {
    const child = spawn(process.execPath, [playwrightCli, 'test', ...playwrightArgs], {
      cwd: rootDir,
      env: {
        ...process.env,
        PLAYWRIGHT_SKIP_WEBSERVER: '1',
      },
      stdio: 'inherit',
      windowsHide: true,
    })

    child.on('exit', code => resolve(code ?? 1))
    child.on('error', (error) => {
      console.error(error)
      resolve(1)
    })
  })
}

try {
  await verifyDependencies()

  for (const service of services) {
    if (await isReady(service.readyUrl)) {
      log(`Reusing ${service.name} at ${service.readyUrl}`)
      continue
    }

    log(`Starting ${service.name}`)
    const child = spawnProcess(service.name, service.args, { env: service.env })
    startedProcesses.push(child)
    await waitForReady(service, child)
  }

  const exitCode = await runPlaywright()
  process.exitCode = exitCode
}
catch (error) {
  console.error(error)
  process.exitCode = 1
}
finally {
  const exitCode = process.exitCode ?? 0
  await Promise.all(startedProcesses.reverse().map(killProcessTree))
  process.exit(exitCode)
}
