// Rebuild the article's diagrams with the project's existing sharp installation.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const output = new URL('../../public/static/images/redis-cache-invalidation-race/', import.meta.url)
await mkdir(output, { recursive: true })

const ink = '#25303b'
const muted = '#68737d'
const line = '#cbd2d8'
const blue = '#286887'
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')

function text(x, y, label, size = 23, color = ink, weight = 400, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(label)}</text>`
}

function path(d, color = line, width = 1.5, dashed = false, arrow = false) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed ? 'stroke-dasharray="6 6"' : ''} ${arrow ? `marker-end="url(#${color === blue ? 'blue' : 'gray'}-arrow)"` : ''}/>`
}

function arrow(x1, y1, x2, y2, color = ink, dashed = false) {
  return path(`M${x1} ${y1} L${x2} ${y2}`, color, 2, dashed, true)
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>text { font-family: 'Apple SD Gothic Neo', 'Noto Sans CJK KR', sans-serif; }</style>
    <defs>${[
      ['gray', ink],
      ['blue', blue],
    ]
      .map(
        ([name, color]) =>
          `<marker id="${name}-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M1 1 L7 4 L1 7" fill="none" stroke="${color}" stroke-width="1.2"/></marker>`
      )
      .join('')}</defs>
    <rect width="${width}" height="${height}" fill="#fff"/>
    ${body}
  </svg>`
}

const race = svg(
  960,
  644,
  [
    text(36, 36, '캐시 삭제 뒤에 이전 값이 다시 저장되는 순서', 21, muted),
    path('M36 57 H924'),
    ...[
      [120, '조회 요청 A'],
      [366, 'DB'],
      [594, '수정 요청 B'],
      [838, 'Redis'],
    ].flatMap(([x, label]) => [
      text(x, 102, label, 24, ink, 500, 'middle'),
      path(`M${x} 124 V516`, line, 1.5, true),
    ]),
    arrow(36, 138, 36, 507, muted),
    text(36, 534, '시간', 18, muted, 400, 'middle'),
    arrow(120, 147, 828, 147),
    text(712, 134, 'GET', 21, muted, 400, 'middle'),
    arrow(838, 185, 130, 185, ink, true),
    text(712, 172, 'miss', 21, muted, 400, 'middle'),
    arrow(120, 221, 356, 221),
    text(243, 208, '가격 조회', 22, ink, 400, 'middle'),
    arrow(366, 261, 130, 261, ink, true),
    text(243, 248, '10,000원', 22, ink, 500, 'middle'),
    '<rect x="112" y="279" width="16" height="175" fill="#f1f3f5" stroke="#cbd2d8" stroke-width="1.5"/>',
    text(150, 333, '저장 대기', 22, muted),
    text(150, 363, '읽어둔 값 유지', 19, muted),
    arrow(594, 316, 376, 316),
    text(480, 303, '가격 수정 12,000원', 21, ink, 400, 'middle'),
    arrow(366, 354, 584, 354, ink, true),
    text(480, 341, '커밋 완료', 21, ink, 400, 'middle'),
    arrow(594, 395, 828, 395),
    text(716, 382, 'DEL', 21, ink, 400, 'middle'),
    arrow(838, 433, 604, 433, ink, true),
    text(716, 420, '0 (키 없음)', 21, muted, 400, 'middle'),
    arrow(120, 490, 828, 490, blue),
    text(480, 477, '이전 값 10,000원 SET', 23, blue, 500, 'middle'),
    path('M36 550 H924'),
    text(120, 589, 'DB 12,000원', 24, ink, 500),
    text(838, 589, 'Redis 10,000원', 24, blue, 500, 'end'),
    text(480, 626, '만료 전 다음 조회는 캐시의 10,000원을 반환한다', 21, muted, 400, 'middle'),
  ].join('\n')
)

const ttl = svg(
  960,
  420,
  [
    text(36, 36, 'TTL은 이전 값을 저장한 시점부터 흐른다', 21, muted),
    path('M36 57 H924'),
    text(36, 94, '조회 시 TTL 연장이나 같은 이전 값의 추가 저장이 없는 경우', 20, muted),
    text(110, 153, 'B의 DB 커밋', 22, ink, 500, 'middle'),
    text(110, 183, '12,000원', 21, muted, 400, 'middle'),
    text(330, 153, 'A의 SET', 22, ink, 500, 'middle'),
    text(330, 183, '10,000원', 21, muted, 400, 'middle'),
    text(680, 153, '키 만료', 22, ink, 500, 'middle'),
    text(865, 153, '다음 조회', 22, ink, 500, 'middle'),
    text(865, 183, 'DB 12,000원', 21, muted, 400, 'middle'),
    arrow(68, 224, 924, 224),
    path('M330 224 H680', blue, 3),
    ...[110, 330, 680, 865].map((x) => path(`M${x} 214 V234`, ink, 2)),
    text(505, 209, '캐시 hit → 10,000원', 21, blue, 400, 'middle'),
    path('M110 259 V272 H330 V259', muted),
    text(220, 306, '저장 지연', 21, muted, 400, 'middle'),
    path('M330 259 V272 H680 V259', blue, 2),
    text(505, 306, 'TTL 2초', 23, blue, 500, 'middle'),
    text(924, 257, '시간', 18, muted, 400, 'end'),
    path('M36 351 H924'),
    text(480, 391, 'TTL은 DB 수정 시점이 아니라 SET 시점부터 계산한다', 22, ink, 400, 'middle'),
  ].join('\n')
)

for (const [name, source] of [
  ['stale-repopulation-v3', race],
  ['ttl-window-v3', ttl],
]) {
  await sharp(Buffer.from(source), { density: 144 })
    .png()
    .toFile(new URL(`${name}.png`, output).pathname)
  console.log(`Created ${name}.png`)
}
