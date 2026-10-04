/**
 * Reproduce stale cache repopulation with SQLite and a local Redis instance.
 *
 * Run: REDIS_PORT=6389 node scripts/examples/redis-cache-invalidation-race.mjs
 * Requires Node.js, redis-cli and sqlite3. No npm packages are needed.
 * Uses only its own randomly named Redis key and temporary SQLite database.
 */

import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

function createSignal() {
  let resolve
  const promise = new Promise((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function waitFor(promise, message) {
  let timer
  try {
    await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), 5000)
      }),
    ])
  } finally {
    clearTimeout(timer)
  }
}

async function main() {
  const port = process.env.REDIS_PORT ?? '6389'
  const key = `article:cache-race:${randomUUID()}:product:1`

  async function redis(...args) {
    const { stdout } = await execFileAsync(
      'redis-cli',
      ['-h', '127.0.0.1', '-p', port, '--raw', ...args.map(String)],
      { timeout: 5000 }
    )
    const result = stdout.trim()
    if (/^(ERR|WRONGTYPE|NOAUTH)\b/.test(result)) {
      throw new Error(result)
    }
    return result
  }

  assert.equal(await redis('PING'), 'PONG')
  const directory = await mkdtemp(join(tmpdir(), 'redis-cache-race-'))
  const database = join(directory, 'products.db')

  async function sql(statement) {
    const { stdout } = await execFileAsync('sqlite3', ['-batch', database, statement], {
      timeout: 5000,
    })
    return stdout.trim()
  }

  async function readPrice() {
    const price = Number(await sql('SELECT price FROM product WHERE id = 1;'))
    assert.ok(Number.isSafeInteger(price))
    return price
  }

  async function updatePrice(price) {
    assert.ok(Number.isSafeInteger(price))
    // sqlite3 exits after committing the update and closing its connection.
    await sql(`UPDATE product SET price = ${price} WHERE id = 1;`)
  }

  async function getPrice() {
    const cached = await redis('GET', key)
    if (cached !== '') {
      return { price: Number(cached), source: 'cache hit' }
    }
    const price = await readPrice()
    assert.equal(await redis('SET', key, price, 'EX', 2), 'OK')
    return { price, source: 'cache miss' }
  }

  try {
    await sql(
      'CREATE TABLE product (id INTEGER PRIMARY KEY, price INTEGER);' +
        'INSERT INTO product VALUES (1, 10000);'
    )

    console.log('[순차 실행]')
    assert.deepEqual(await getPrice(), { price: 10000, source: 'cache miss' })
    await updatePrice(12000)
    assert.equal(await redis('DEL', key), '1')
    const sequential = await getPrice()
    assert.deepEqual(sequential, { price: 12000, source: 'cache miss' })
    console.log(`C: ${sequential.source}, 응답 = ${sequential.price}`)

    console.log('\n[요청이 겹친 실행]')
    await updatePrice(10000)
    await redis('DEL', key)
    const dbRead = createSignal()
    const updateDone = createSignal()

    async function requestA() {
      assert.equal(await redis('GET', key), '')
      console.log('A: cache miss')
      const oldPrice = await readPrice()
      assert.equal(oldPrice, 10000)
      console.log(`A: DB 조회 = ${oldPrice}, 캐시 저장 직전 대기`)
      dbRead.resolve()
      await waitFor(updateDone.promise, 'The update request did not finish.')
      assert.equal(await redis('SET', key, oldPrice, 'EX', 2), 'OK')
      console.log(`A: 이전 값 ${oldPrice}을 캐시에 저장 (TTL 2초)`)
    }

    async function requestB() {
      try {
        await waitFor(dbRead.promise, 'The read request did not reach the checkpoint.')
        await updatePrice(12000)
        console.log('B: DB 수정 및 커밋 = 12000')
        const deleted = await redis('DEL', key)
        assert.equal(deleted, '0')
        console.log(`B: DEL 반환값 = ${deleted} (현재 키 없음)`)
      } finally {
        updateDone.resolve()
      }
    }

    // Wait for both requests, including failures, before cleaning up their data.
    const results = await Promise.allSettled([requestA(), requestB()])
    for (const result of results) {
      if (result.status === 'rejected') throw result.reason
    }

    assert.equal(await readPrice(), 12000)
    assert.equal(await redis('GET', key), '10000')
    const concurrent = await getPrice()
    assert.deepEqual(concurrent, { price: 10000, source: 'cache hit' })
    console.log(`C: ${concurrent.source}, 응답 = ${concurrent.price} / DB = ${await readPrice()}`)

    const deadline = Date.now() + 5000
    while ((await redis('GET', key)) !== '') {
      if (Date.now() >= deadline) throw new Error('The cache key did not expire.')
      await delay(50)
    }
    const expired = await getPrice()
    assert.deepEqual(expired, { price: 12000, source: 'cache miss' })
    console.log(`TTL 만료 후: ${expired.source}, 응답 = ${expired.price}`)
    console.log('\n검증 완료: 순차 실행, 오래된 값 재저장, TTL 만료 후 갱신')
  } finally {
    try {
      await redis('DEL', key)
    } finally {
      await rm(directory, { recursive: true, force: true })
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(error)
  process.exitCode = 1
}
