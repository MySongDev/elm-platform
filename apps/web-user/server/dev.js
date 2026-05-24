import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

const commands = [
  {
    name: 'pay-api',
    color: '\x1B[36m',
    command: process.execPath,
    args: ['--watch', 'server/index.js'],
  },
  {
    name: 'web',
    color: '\x1B[35m',
    command: process.execPath,
    args: [path.join(rootDir, 'node_modules/vite/bin/vite.js'), '--host'],
  },
]

const children = new Set()
let shuttingDown = false

function writePrefixed(stream, name, color, output) {
  let buffer = ''

  stream.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split(/\r?\n/)
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line)
        output.write(`${color}[${name}]\x1B[0m ${line}\n`)
    }
  })

  stream.on('end', () => {
    if (buffer)
      output.write(`${color}[${name}]\x1B[0m ${buffer}\n`)
  })
}

function stopAll(exitCode = 0) {
  if (shuttingDown)
    return

  shuttingDown = true

  for (const child of children)
    child.kill('SIGTERM')

  setTimeout(() => {
    process.exit(exitCode)
  }, 300).unref()
}

for (const item of commands) {
  const child = spawn(item.command, item.args, {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  children.add(child)
  writePrefixed(child.stdout, item.name, item.color, process.stdout)
  writePrefixed(child.stderr, item.name, item.color, process.stderr)

  child.on('error', (error) => {
    console.error(`[${item.name}] failed to start: ${error.message}`)
    stopAll(1)
  })

  child.on('exit', (code, signal) => {
    children.delete(child)

    if (shuttingDown)
      return

    const exitCode = code ?? (signal ? 1 : 0)
    console.error(`[${item.name}] exited with ${signal || exitCode}`)
    stopAll(exitCode)
  })
}

process.on('SIGINT', () => stopAll(0))
process.on('SIGTERM', () => stopAll(0))
