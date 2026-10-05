/**
 * Reproduce cache stampedes with an isolated Redis server and SQLite.
 * Run with Node 22: node scripts/examples/redis-cache-stampede.mjs
 * Requires redis-server. Uses no application keys or persistent Redis files.
 * Timings include an artificial 100 ms wait in the database read path.
 */
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import { createConnection } from 'node:net'
import { performance } from 'node:perf_hooks'
import { DatabaseSync } from 'node:sqlite'
import { setTimeout as delay } from 'node:timers/promises'

// This small connection only supports the scalar RESP replies used below.
class RedisConnection {
  constructor(socket) {
    this.socket = socket
    this.buffer = Buffer.alloc(0)
    this.waiting = []
    socket.on('data', (chunk) => {
      this.buffer = Buffer.concat([this.buffer, chunk])
      while (this.waiting.length > 0) {
        const end = this.buffer.indexOf('\r\n')
        if (end < 0) break
        const type = String.fromCharCode(this.buffer[0])
        const line = this.buffer.subarray(1, end).toString()
        let length = end + 2
        let value = line
        if (type === '$') {
          const size = Number(line)
          if (size === -1) value = null
          else {
            length += size + 2
            if (this.buffer.length < length) break
            value = this.buffer.subarray(end + 2, end + 2 + size).toString()
          }
        } else if (type === ':') value = Number(line)
        else assert.ok(type === '+' || type === '-', `Unsupported RESP type ${type}`)
        this.buffer = this.buffer.subarray(length)
        const pending = this.waiting.shift()
        if (type === '-') pending.reject(new Error(value))
        else pending.resolve(value)
      }
    })
    const fail = (error) => {
      for (const pending of this.waiting.splice(0)) pending.reject(error)
    }
    socket.on('error', fail)
    socket.on('close', () => fail(new Error('Redis connection closed')))
  }

  command(...args) {
    const parts = [Buffer.from(`*${args.length}\r\n`)]
    for (const arg of args) {
      const bytes = Buffer.from(String(arg))
      parts.push(Buffer.from(`$${bytes.length}\r\n`), bytes, Buffer.from('\r\n'))
    }
    return new Promise((resolve, reject) => {
      this.waiting.push({ resolve, reject })
      this.socket.write(Buffer.concat(parts))
    })
  }

  get(key) {
    return this.command('GET', key)
  }

  set(key, value, { EX, PX } = {}) {
    const args = ['SET', key, value]
    if (EX !== undefined) args.push('EX', EX)
    if (PX !== undefined) args.push('PX', PX)
    return this.command(...args)
  }
}

function createBarrier(count) {
  let remaining = count
  let release
  const ready = new Promise((resolve) => {
    release = resolve
  })
  return async () => {
    if (--remaining === 0) release()
    await ready
  }
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b)
  return Number(sorted[Math.ceil(sorted.length * fraction) - 1].toFixed(2))
}

async function main() {
  const port = Number(process.env.REDIS_PORT ?? 6389)
  const server = spawn(
    'redis-server',
    ['--bind', '127.0.0.1', '--port', String(port), '--save', '', '--appendonly', 'no'],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  )
  let serverLog = ''
  server.stdout.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  server.stderr.on('data', (chunk) => {
    serverLog += chunk.toString()
  })
  server.on('error', (error) => {
    serverLog += error.message
  })
  let redis
  const database = new DatabaseSync(':memory:')

  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (server.exitCode !== null) throw new Error(serverLog)
      try {
        const socket = createConnection({ host: '127.0.0.1', port })
        await once(socket, 'connect')
        redis = new RedisConnection(socket)
        break
      } catch {
        await delay(25)
      }
    }
    assert.ok(redis, `Redis did not start: ${serverLog}`)
    assert.equal(await redis.command('PING'), 'PONG')
    database.exec(
      'CREATE TABLE product (id INTEGER PRIMARY KEY, price INTEGER); INSERT INTO product VALUES (1, 12000);'
    )
    const selectProduct = database.prepare('SELECT id, price FROM product WHERE id = ?')
    const prefix = `article:stampede:${randomUUID()}`
    const inFlight = new Map()
    let databaseReads = 0

    async function readProduct(fail = false) {
      databaseReads++
      await delay(100)
      if (fail) throw new Error('Injected database failure')
      return { ...selectProduct.get(1) }
    }

    async function singleFlight(key, work) {
      const existing = inFlight.get(key)
      if (existing) return existing
      const loading = Promise.resolve().then(work)
      inFlight.set(key, loading)
      try {
        return await loading
      } finally {
        inFlight.delete(key)
      }
    }

    const results = []
    for (const mode of ['baseline', 'coalescing', 'early-refresh']) {
      for (let round = 1; round <= 3; round++) {
        const key = `${prefix}:${mode}:${round}`
        const early = mode === 'early-refresh'
        await redis.set(
          key,
          JSON.stringify({ data: { id: 1, price: 10000 }, refreshAfter: Date.now() + 50 }),
          { PX: 1000 }
        )
        if (early) await delay(70)
        else while ((await redis.get(key)) !== null) await delay(20)
        databaseReads = 0
        const barrier = createBarrier(100)
        let refreshing

        async function load() {
          const cachedAgain = await redis.get(key)
          if (cachedAgain !== null) return JSON.parse(cachedAgain).data
          const data = await readProduct()
          await redis.set(key, JSON.stringify({ data }), { EX: 60 })
          return data
        }

        async function getProduct() {
          const cached = await redis.get(key)
          await barrier() // Every request completes its first GET before continuing.
          if (cached !== null) {
            const entry = JSON.parse(cached)
            if (early && Date.now() >= entry.refreshAfter) {
              refreshing = singleFlight(key, async () => {
                const data = await readProduct()
                await redis.set(key, JSON.stringify({ data, refreshAfter: Date.now() + 50000 }), {
                  EX: 60,
                })
                return data
              })
              // Observe rejection even though the foreground response does not await it.
              refreshing.catch(() => {})
            }
            return entry.data
          }
          if (mode === 'coalescing') return singleFlight(key, load)
          const data = await readProduct()
          await redis.set(key, JSON.stringify({ data }), { EX: 60 })
          return data
        }

        const latencies = await Promise.all(
          Array.from({ length: 100 }, async () => {
            const start = performance.now()
            const product = await getProduct()
            const elapsed = performance.now() - start
            assert.equal(product.price, early ? 10000 : 12000)
            return elapsed
          })
        )
        const foregroundReads = databaseReads
        if (refreshing) await refreshing
        assert.equal(databaseReads, mode === 'baseline' ? 100 : 1)
        assert.equal(JSON.parse(await redis.get(key)).data.price, 12000)
        assert.equal(inFlight.size, 0)
        results.push({
          mode,
          round,
          dbReads: databaseReads,
          foregroundReads,
          p50: percentile(latencies, 0.5),
          p95: percentile(latencies, 0.95),
        })
        await redis.command('DEL', key)
      }
    }

    // Coalesced failures are shared, and a later request can retry after cleanup.
    databaseReads = 0
    const failureKey = `${prefix}:failure`
    const failures = await Promise.allSettled(
      Array.from({ length: 100 }, () => singleFlight(failureKey, () => readProduct(true)))
    )
    assert.equal(databaseReads, 1)
    assert.ok(failures.every((result) => result.status === 'rejected'))
    assert.equal(inFlight.size, 0)
    assert.equal((await singleFlight(failureKey, () => readProduct())).price, 12000)
    assert.equal(databaseReads, 2)

    // A separate workload shows expiry distribution across twenty different keys.
    const jitterResults = []
    for (const mode of ['fixed-ttl', 'ttl-jitter']) {
      const keys = Array.from({ length: 20 }, (_, index) => `${prefix}:${mode}:${index}`)
      await Promise.all(
        keys.map((key, index) =>
          redis.set(key, 'cached', { PX: mode === 'fixed-ttl' ? 400 : 400 + ((index * 73) % 401) })
        )
      )
      const start = performance.now()
      const buckets = new Map()
      let misses = 0
      while (performance.now() - start < 1200) {
        await Promise.all(
          keys.map(async (key) => {
            if ((await redis.get(key)) !== null) return
            const bucket = Math.floor((performance.now() - start) / 100)
            buckets.set(bucket, (buckets.get(bucket) ?? 0) + 1)
            misses++
            await readProduct()
            await redis.set(key, 'refilled', { EX: 60 })
          })
        )
        await delay(20)
      }
      assert.equal(misses, 20)
      jitterResults.push({
        mode,
        totalDbReads: misses,
        peakReadsPer100ms: Math.max(...buckets.values()),
      })
      await redis.command('DEL', ...keys)
    }
    assert.equal(jitterResults[0].peakReadsPer100ms, 20)
    assert.ok(jitterResults[1].peakReadsPer100ms < 20)

    console.log(
      JSON.stringify(
        {
          node: process.version,
          concurrency: 100,
          artificialDbDelayMs: 100,
          results,
          jitterResults,
          failureCleanup: 'passed',
        },
        null,
        2
      )
    )
  } finally {
    database.close()
    redis?.socket.destroy()
    if (server.exitCode === null) {
      const stopped = once(server, 'exit')
      server.kill('SIGTERM')
      await stopped
    }
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
