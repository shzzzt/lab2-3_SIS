import { execFileSync, spawn } from 'node:child_process'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'

const root = realpathSync(fileURLToPath(new URL('../', import.meta.url)))
const services = [
  { name: 'API', port: 8000, directories: [root, resolve(root, 'public')], command: 'php', args: ['artisan', 'serve', '--host=127.0.0.1', '--port=8000'], cwd: root },
  { name: 'Frontend', port: 5173, directories: [resolve(root, 'student-frontend')], command: 'npm', args: ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], cwd: resolve(root, 'student-frontend') },
]

function alreadyRunning(service) {
  let output
  try {
    output = execFileSync('lsof', ['-nP', `-iTCP:${service.port}`, '-sTCP:LISTEN', '-t'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (error) {
    if (error.status === 1 && !error.stderr?.toString().trim()) return false
    throw new Error(`Could not check port ${service.port}. This local launcher requires lsof (included with macOS).`)
  }
  const pids = [...new Set(output.trim().split(/\s+/).filter(Boolean))]
  for (const pid of pids) {
    const files = execFileSync('lsof', ['-a', '-p', pid, '-d', 'cwd', '-Fn'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    const cwd = files.split('\n').find((line) => line.startsWith('n'))?.slice(1)
    if (!cwd || !service.directories.includes(realpathSync(cwd))) {
      throw new Error(`Port ${service.port} is used by another project (PID ${pid}). Stop that server or free the port before retrying. No processes were stopped.`)
    }
  }
  return pids.length > 0
}

// Check both ports before launching anything. Never stop an existing server.
let missing
try {
  missing = services.filter((service) => {
    if (!alreadyRunning(service)) return true
    console.log(`${service.name} is already running for this project on port ${service.port}.`)
    return false
  })
} catch (error) {
  console.error(error.message)
  process.exit(1)
}

console.log('\nOpen the app: http://127.0.0.1:5173\nAPI: http://127.0.0.1:8000\n')
if (missing.length === 0) {
  console.log('Both servers are already running. Open the app link above.')
  process.exit(0)
}

const children = []
let stopping = false
function stop(code) {
  if (stopping) return
  stopping = true
  for (const child of children) {
    if (!child.pid) continue
    try { process.kill(-child.pid, 'SIGTERM') } catch { /* Process already exited. */ }
  }
  process.exitCode = code
}
process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
for (const service of missing) {
  console.log(`Starting ${service.name}…`)
  const child = spawn(service.command, service.args, { cwd: service.cwd, stdio: 'inherit', detached: true })
  children.push(child)
  child.on('error', (error) => { console.error(`${service.name}: ${error.message}`); stop(1) })
  child.on('exit', (code) => {
    if (!stopping) {
      console.error(`${service.name} stopped (exit ${code ?? 'signal'}).`)
      stop(code || 1)
    }
  })
}
console.log('Keep this terminal open. Ctrl+C stops only servers started here.')
