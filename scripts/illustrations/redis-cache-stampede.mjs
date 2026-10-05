// Rebuild the article's diagrams with the project's existing sharp installation.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const output = new URL('../../public/static/images/redis-cache-stampede/', import.meta.url)
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

function request(x, y, label) {
  return `<rect x="${x}" y="${y}" width="112" height="36" rx="3" fill="#fff" stroke="${line}" stroke-width="1.5"/>${text(x + 56, y + 25, label, 22, ink, 400, 'middle')}`
}

function database(x, y, color = ink) {
  return `<path d="M${x} ${y + 17} v105 c0 22 132 22 132 0 V${y + 17}" fill="#fff" stroke="${color}" stroke-width="2"/>
    <ellipse cx="${x + 66}" cy="${y + 17}" rx="66" ry="17" fill="#fff" stroke="${color}" stroke-width="2"/>
    ${path(`M${x} ${y + 104} c0 22 132 22 132 0`, line)}
    ${text(x + 66, y + 76, 'DB', 27, color, 500, 'middle')}`
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

const comparison = svg(
  960,
  576,
  [
    text(36, 36, '같은 상품의 캐시가 비어 있을 때', 21, muted),
    text(924, 36, '단일 애플리케이션 프로세스', 19, muted, 400, 'end'),
    path('M36 57 H924'),
    text(36, 96, '각 요청이 DB 조회', 25, ink, 600),
    text(710, 96, '조회 × 3', 23, ink, 500, 'end'),
    ...[136, 190, 244].flatMap((y, index) => [
      request(48, y, `요청 ${['A', 'B', 'C'][index]}`),
      arrow(174, y + 18, 774, y + 18),
    ]),
    database(788, 136),
    path('M36 307 H924'),
    text(36, 347, '진행 중인 조회를 공유', 25, ink, 600),
    ...[378, 432, 486].flatMap((y, index) => [
      request(48, y, `요청 ${['A', 'B', 'C'][index]}`),
      path(`M174 ${y + 18} C260 ${y + 18} 280 450 340 450`, blue, 2),
    ]),
    '<circle cx="340" cy="450" r="4" fill="#286887"/>',
    arrow(340, 450, 395, 450, blue),
    `<rect x="408" y="410" width="225" height="80" rx="3" fill="#f5f8fa" stroke="${blue}" stroke-width="1.5"/>`,
    text(520, 442, '진행 중인 조회', 23, ink, 400, 'middle'),
    text(520, 470, 'Promise', 22, blue, 500, 'middle'),
    arrow(648, 450, 774, 450, blue),
    text(710, 429, '조회 × 1', 22, blue, 500, 'middle'),
    database(788, 382, blue),
    text(520, 535, '세 요청이 같은 결과를 기다린다', 21, muted, 400, 'middle'),
  ].join('\n')
)

const refresh = svg(
  960,
  644,
  [
    text(36, 36, '50~60초 사이에 요청이 들어와, 만료 전에 갱신을 마친 예', 21, muted),
    path('M36 57 H924'),
    ...[
      [96, '요청'],
      [330, '애플리케이션'],
      [598, 'Redis'],
      [846, 'DB'],
    ].flatMap(([x, label]) => [
      text(x, 102, label, 24, ink, 500, 'middle'),
      path(`M${x} 124 V${x === 96 ? 328 : 492}`, line, 1.5, true),
    ]),
    arrow(24, 136, 24, 488, line),
    text(24, 518, '시간', 18, muted),
    arrow(96, 147, 320, 147),
    text(208, 134, '상품 조회', 22, ink, 400, 'middle'),
    arrow(330, 193, 588, 193),
    text(465, 180, 'GET', 20, muted, 400, 'middle'),
    arrow(598, 237, 340, 237, ink, true),
    text(465, 224, '기존 캐시 값', 22, ink, 400, 'middle'),
    `<rect x="839" y="271" width="14" height="136" fill="#eaf1f5" stroke="${blue}" stroke-width="1.5"/>`,
    arrow(330, 271, 829, 271, blue),
    text(710, 258, '갱신 조회 1회', 22, blue, 500, 'middle'),
    arrow(330, 320, 106, 320),
    text(208, 307, '기존 값 응답', 22, ink, 500, 'middle'),
    text(96, 359, '응답 완료', 20, muted, 400, 'middle'),
    arrow(839, 407, 340, 407, blue, true),
    text(710, 394, '새 값', 22, blue, 400, 'middle'),
    arrow(330, 464, 588, 464, blue),
    text(465, 451, 'SET으로 TTL 재설정', 22, blue, 400, 'middle'),
    path('M36 545 H924'),
    text(36, 582, '갱신 실패 / 요청 없음', 21, muted),
    arrow(290, 575, 338, 575, muted),
    text(357, 582, '60초 만료', 21, ink),
    arrow(483, 575, 531, 575, muted),
    text(552, 582, '다음 요청은 DB 조회 결과 대기', 21, ink),
    text(36, 619, '갱신에 성공하면 새로 설정한 TTL을 따른다.', 19, muted),
  ].join('\n')
)

for (const [name, source] of [
  ['request-coalescing-flow-v2', comparison],
  ['early-refresh-sequence-v2', refresh],
]) {
  await sharp(Buffer.from(source), { density: 144 })
    .png()
    .toFile(new URL(`${name}.png`, output).pathname)
  console.log(`Created ${name}.png`)
}
