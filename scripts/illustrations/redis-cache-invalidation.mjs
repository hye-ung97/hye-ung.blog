// Rebuild the article's PNG diagrams with the project's existing sharp installation.
// Run with Node 22 from the repository root.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const output = new URL('../../public/static/images/redis-cache-invalidation-race/', import.meta.url)
await mkdir(output, { recursive: true })

const ink = '#172033'
const muted = '#667085'
const blue = '#4f46e5'
const green = '#087f72'
const orange = '#b54708'
const escape = (value) => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;')

function text(x, y, label, size = 34, color = ink, weight = 500, anchor = 'start') {
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}" text-anchor="${anchor}">${escape(label)}</text>`
}

function box(x, y, width, height, fill = '#fff', stroke = '#e4e7ec', dashed = false) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="18" fill="${fill}" stroke="${stroke}" stroke-width="2" ${dashed ? 'stroke-dasharray="8 8"' : ''}/>`
}

function step(number, y, side) {
  const edge = side === 'left' ? 490 : 610
  return `<line x1="550" y1="${y}" x2="${edge}" y2="${y}" stroke="#cbd1db" stroke-width="3"/>
    <circle cx="550" cy="${y}" r="25" fill="#f6f7fb" stroke="#cbd1db" stroke-width="2"/>
    ${text(550, y + 11, number, 30, muted, 600, 'middle')}`
}

function svg(width, height, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <style>text { font-family: 'Apple SD Gothic Neo', 'Noto Sans CJK KR', sans-serif; }</style>
    <rect width="${width}" height="${height}" rx="24" fill="#f6f7fb"/>
    ${body}
  </svg>`
}

const race = svg(
  1100,
  1280,
  [
    text(55, 75, '삭제 후에 돌아온 오래된 값', 46, ink, 700),
    text(55, 122, '아래로 갈수록 시간이 흐른다', 30, muted),
    box(80, 168, 410, 62, '#eeecff', '#eeecff'),
    text(285, 210, '조회 요청 A', 34, blue, 700, 'middle'),
    box(610, 168, 410, 62, '#e4f4ee', '#e4f4ee'),
    text(815, 210, '수정 요청 B', 34, green, 700, 'middle'),
    '<path d="M550 258 V1014" stroke="#cbd1db" stroke-width="3" stroke-dasharray="7 9"/>',
    box(80, 266, 410, 98),
    text(110, 327, '캐시 miss', 38, blue, 650),
    step(1, 315, 'left'),
    box(80, 400, 410, 126),
    text(110, 446, 'DB 조회', 32, muted),
    text(110, 498, '10,000원', 46, ink, 700),
    step(2, 463, 'left'),
    box(80, 563, 410, 250, '#f0f2f6', '#cbd1db', true),
    text(285, 657, '저장 직전 대기', 34, muted, 600, 'middle'),
    text(285, 714, 'A가 읽어둔 값은', 30, muted, 500, 'middle'),
    text(285, 761, '아직 10,000원', 38, ink, 650, 'middle'),
    box(610, 563, 410, 116, '#e4f4ee', '#b4dcd0'),
    text(640, 608, 'DB 수정 후 커밋', 32, green, 600),
    text(640, 657, '12,000원', 44, green, 700),
    step(3, 621, 'right'),
    box(610, 721, 410, 92),
    text(640, 779, '캐시 삭제', 38, green, 650),
    step(4, 767, 'right'),
    box(80, 865, 410, 132, '#fff3e8', '#ecc4a4'),
    text(110, 913, '이전 값을 다시 저장', 32, orange, 600),
    text(110, 966, '10,000원', 46, orange, 700),
    step(5, 931, 'left'),
    '<line x1="55" y1="1040" x2="1045" y2="1040" stroke="#dce1e9" stroke-width="2"/>',
    box(55, 1071, 475, 130, '#e4f4ee', '#b4dcd0'),
    text(85, 1117, '최종 DB', 30, green, 600),
    text(85, 1171, '12,000원', 46, green, 700),
    box(570, 1071, 475, 130, '#fff3e8', '#ecc4a4'),
    text(600, 1117, '최종 Redis', 30, orange, 600),
    text(600, 1171, '10,000원', 46, orange, 700),
    text(550, 1250, '다음 조회는 캐시의 10,000원을 받는다', 31, muted, 500, 'middle'),
  ].join('\n')
)

const ttl = svg(
  1100,
  815,
  [
    text(55, 75, 'TTL은 재저장 시점부터 흐른다', 46, ink, 700),
    text(55, 123, '조회할 때 만료 시간을 연장하지 않는 경우', 30, muted),
    '<path d="M98 220 V660" stroke="#cbd1db" stroke-width="4"/>',
    box(160, 178, 800, 100, '#e4f4ee', '#b4dcd0'),
    text(190, 240, 'B의 DB 수정', 36, green, 650),
    text(920, 240, '12,000원', 42, green, 700, 'end'),
    '<circle cx="98" cy="228" r="14" fill="#087f72"/>',
    box(160, 329, 800, 104, '#fff3e8', '#ecc4a4'),
    text(190, 393, 'A의 이전 값 재저장', 36, orange, 650),
    text(920, 393, '10,000원', 42, orange, 700, 'end'),
    '<circle cx="98" cy="381" r="14" fill="#b54708"/>',
    box(160, 458, 800, 107, '#eeecff', '#d8d3fb'),
    text(560, 501, 'SET 실행부터 TTL 2초', 36, blue, 700, 'middle'),
    text(560, 542, '그동안 cache hit은 10,000원을 반환', 30, blue, 500, 'middle'),
    box(160, 609, 800, 104, '#e4f4ee', '#b4dcd0'),
    text(190, 673, '만료 후 다음 조회', 36, green, 650),
    text(920, 673, '12,000원', 42, green, 700, 'end'),
    '<circle cx="98" cy="661" r="14" fill="#087f72"/>',
    text(550, 774, 'DB 수정 시점과 캐시 TTL의 시작은 다르다', 32, muted, 500, 'middle'),
  ].join('\n')
)

for (const [name, source] of [
  ['stale-repopulation-v2', race],
  ['ttl-window-v2', ttl],
]) {
  await sharp(Buffer.from(source), { density: 144 })
    .png()
    .toFile(new URL(`${name}.png`, output).pathname)
  console.log(`Created ${name}.png`)
}
