// Rebuild the book chapter's explanatory diagrams with the existing sharp installation.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const output = new URL(
  '../../public/static/images/books/junior-backend-practical-knowledge/',
  import.meta.url
)
await mkdir(output, { recursive: true })

const ink = '#25303b'
const muted = '#68737d'
const line = '#cbd2d8'
const blue = '#286887'
const amber = '#8c6a37'
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')

function text(x, y, label, size = 23, color = ink, weight = 400, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(label)}</text>`
}

function path(d, color = line, width = 1.5, dashed = false, arrow = false) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${dashed ? 'stroke-dasharray="6 6"' : ''} ${arrow ? `marker-end="url(#${color === blue ? 'blue' : 'gray'}-arrow)"` : ''}/>`
}

function arrow(x1, y1, x2, y2, color = ink) {
  return path(`M${x1} ${y1} L${x2} ${y2}`, color, 2, false, true)
}

function box(x, y, width, height, fill = '#fff', stroke = line) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`
}

function svg(height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="${height}" viewBox="0 0 960 ${height}">
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
    <rect width="960" height="${height}" fill="#fff"/>
    ${body}
  </svg>`
}

const response = svg(
  490,
  [
    text(36, 46, '응답 시간과 TTFB, TTLB', 28, ink, 600),
    text(36, 82, '일반적인 API 요청의 흐름', 21, muted),
    path('M36 102 H924'),
    text(48, 142, '요청 시작', 21, muted),
    text(628, 142, '첫 바이트', 21, blue, 500, 'middle'),
    text(912, 142, '마지막 바이트', 21, ink, 500, 'end'),
    ...[
      [48, 160, '연결과 요청', '전송', '#f5f6f7', ink],
      [208, 190, '대기', '커넥션, 작업 큐', '#faf6ee', amber],
      [398, 230, '서버 처리', 'DB 조회, API 호출', '#f5f6f7', ink],
      [628, 284, '응답 전송', '첫 바이트 → 마지막 바이트', '#edf4f7', blue],
    ].flatMap(([x, width, label, detail, fill, color]) => [
      box(x, 172, width, 96, fill),
      text(x + width / 2, 210, label, 24, color, 500, 'middle'),
      text(x + width / 2, 243, detail, 19, muted, 400, 'middle'),
    ]),
    ...[48, 628, 912].map((x) => path(`M${x} 159 V286`, line, 1.5, true)),
    text(338, 322, 'TTFB: 첫 바이트를 받을 때까지', 23, blue, 500, 'middle'),
    arrow(48, 342, 628, 342, blue),
    text(480, 390, 'TTLB: 전체 응답을 받을 때까지', 23, ink, 500, 'middle'),
    arrow(48, 410, 912, 410),
    text(36, 464, '구간의 길이는 실제 소요 시간과 다르다.', 19, muted),
  ].join('\n')
)

const pool = svg(
  540,
  [
    text(36, 46, '서버 수와 DB 커넥션 수', 28, ink, 600),
    text(36, 82, '서버마다 최대 10개의 커넥션을 사용하는 예', 21, muted),
    path('M36 102 H924'),
    ...[146, 263, 380].flatMap((y, index) => [
      box(48, y, 290, 84, '#f5f8fa'),
      text(70, y + 33, `애플리케이션 서버 ${index + 1}`, 23, ink, 500),
      text(70, y + 63, '커넥션 풀 (최대 10개)', 21, blue),
      path(`M338 ${y + 42} H520`, blue, 2),
    ]),
    path('M520 188 V422', blue, 2),
    arrow(520, 305, 696, 305, blue),
    text(609, 272, '최대 30개', 23, blue, 500, 'middle'),
    '<circle cx="520" cy="305" r="4" fill="#286887"/>',
    `<path d="M712 247 V357 C712 387 884 387 884 357 V247" fill="#fff" stroke="${ink}" stroke-width="2"/>`,
    `<ellipse cx="798" cy="247" rx="86" ry="23" fill="#fff" stroke="${ink}" stroke-width="2"/>`,
    path('M712 336 C712 366 884 366 884 336', line),
    text(798, 313, 'DB', 31, ink, 600, 'middle'),
    text(798, 417, '전체 연결 수 확인', 22, muted, 400, 'middle'),
    path('M36 483 H924'),
    text(36, 517, '서버 3대 × 최대 10개 = 최대 30개', 20, muted),
  ].join('\n')
)

const cache = svg(
  510,
  [
    text(36, 46, '캐시 조회 흐름', 28, ink, 600),
    text(36, 82, '캐시에 없으면 DB에서 조회하고 저장한다.', 21, muted),
    path('M36 102 H924'),
    text(48, 150, 'HIT (캐시에 있음)', 23, blue, 500),
    ...[
      [48, '캐시 확인'],
      [278, '결과 응답'],
    ].flatMap(([x, label]) => [
      box(x, 170, 190, 76, '#edf4f7', blue),
      text(x + 95, 216, label, 25, blue, 500, 'middle'),
    ]),
    arrow(250, 208, 266, 208, blue),
    text(510, 216, 'DB 조회 생략', 22, muted),
    path('M36 281 H924'),
    text(48, 325, 'MISS (캐시에 없음)', 23, ink, 500),
    ...['캐시 확인', 'DB 조회', '캐시에 저장', '결과 응답'].flatMap((label, index) => {
      const x = 48 + index * 230
      return [
        box(x, 345, 190, 76),
        text(x + 95, 391, label, 24, ink, 500, 'middle'),
        ...(index < 3 ? [arrow(x + 202, 383, x + 218, 383)] : []),
      ]
    }),
    text(36, 483, '저장한 값은 이후 조회에서 사용한다.', 21, muted),
  ].join('\n')
)

for (const [name, source] of [
  ['response-time', response],
  ['pool-connections', pool],
  ['cache-aside', cache],
]) {
  await sharp(Buffer.from(source), { density: 144 })
    .png()
    .toFile(new URL(`${name}-v2.png`, output).pathname)
  console.log(`Created ${name}-v2.png`)
}
