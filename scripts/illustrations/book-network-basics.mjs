import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/static/images/books/junior-backend-practical-knowledge/ch10')
const c = {
  ink: '#172b45',
  muted: '#52657a',
  line: '#cbd7e5',
  blue: '#eef4ff',
  blueInk: '#235ab9',
  green: '#e9f7f4',
  greenInk: '#087e80',
  amber: '#fff4df',
  amberInk: '#94600c',
}
const escape = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;')
const text = (x, y, value, size = 24, color = c.ink, anchor = 'start', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${escape(value)}</text>`
const label = (x, y, value) => text(x, y, value, 21, c.muted, 'middle')
const box = (x, y, w, h, title, detail, fill = c.blue, ink = c.blueInk) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="${fill}" stroke="${c.line}"/>` +
  text(x + w / 2, y + (detail ? 35 : h / 2 + 8), title, 25, ink, 'middle', 600) +
  (detail ? text(x + w / 2, y + 67, detail, 21, ink, 'middle') : '')
const arrow = (d, dashed = false) =>
  `<path d="${d}" fill="none" stroke="${c.muted}" stroke-width="2.5" marker-end="url(#arrow)"${dashed ? ' stroke-dasharray="7 5"' : ''}/>`
const group = (x, y, w, h, title) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="#f8fafc" stroke="${c.line}" stroke-dasharray="7 5"/>` +
  text(x + w / 2, y + 30, title, 22, c.muted, 'middle', 600)
const svg = (title, desc, height, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}" role="img" aria-labelledby="title desc">
<title id="title">${escape(title)}</title><desc id="desc">${escape(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${c.muted}"/></marker></defs>
<rect width="900" height="${height}" rx="18" fill="#fff"/>
<g font-family="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">
${text(32, 49, title, 29, c.ink, 'start', 700)}
${body}
</g></svg>\n`

const drawings = {
  'network-route.svg': svg(
    '서로 다른 네트워크는 라우터를 거친다',
    '사무실 노드가 사무실 경계 라우터와 중간 라우터, 서버 측 라우터를 거쳐 서버에 데이터를 보낸다. 라우터는 목적지 주소를 보고 다음 전달 경로를 선택한다.',
    460,
    label(450, 89, '라우터는 목적지 주소를 보고 다음 전달 경로를 선택한다.') +
      group(32, 112, 278, 294, '사무실 네트워크') +
      group(590, 112, 278, 294, '서버 네트워크') +
      box(66, 165, 210, 82, '클라이언트 노드', '노트북') +
      box(66, 298, 210, 82, '경계 라우터', '사무실 망의 경계', c.green, c.greenInk) +
      box(360, 228, 180, 92, '중간 라우터', '다음 경로 선택', c.green, c.greenInk) +
      box(624, 165, 210, 82, '서버 측 라우터', '서버 망의 경계', c.green, c.greenInk) +
      box(624, 298, 210, 82, '서버 노드', 'API 처리') +
      arrow('M171 247V290') +
      arrow('M276 339H324V274H352') +
      arrow('M540 274H570V206H616') +
      arrow('M729 247V290') +
      label(450, 438, '통신 경로에는 여러 라우터가 있을 수 있다.')
  ),
  'dns-lookup.svg': svg(
    '이름으로 주소를 조회하고 그 주소로 접속한다',
    '클라이언트가 api.example.test의 주소를 조회한다. DNS 조회 결과로 두 주소를 받고 그중 198.51.100.20으로 접속하는 예다. 실제 조회 결과가 아닌 설명용 주소다.',
    550,
    box(56, 125, 200, 92, '클라이언트', '이름으로 접속') +
      box(350, 125, 200, 92, 'DNS 조회', '주소 정보 응답', c.amber, c.amberInk) +
      box(650, 125, 218, 92, 'API 서버', '198.51.100.20', c.green, c.greenInk) +
      `<path d="M156 217V475M450 217V475M759 217V475" stroke="${c.line}" stroke-width="2" stroke-dasharray="7 5"/>` +
      arrow('M156 265H442') +
      text(180, 246, '① api.example.test 주소 문의', 20, c.muted) +
      arrow('M450 345H164') +
      label(302, 325, '② .20과 .21 주소 응답') +
      arrow('M156 435H751') +
      label(450, 415, '③ 받은 주소 중 198.51.100.20으로 접속') +
      label(450, 510, '예시 응답: 198.51.100.20 / 198.51.100.21') +
      label(450, 538, '실측값이 아닌 설명용 도메인과 주소다.')
  ),
  'nat-direction.svg': svg(
    'SNAT는 출발지, DNAT는 목적지를 바꾼다',
    '나가는 요청은 출발지 사설 IP 10.20.0.15가 공인 IP 198.51.100.10으로 바뀐다. 들어오는 요청은 목적지 공인 IP 198.51.100.10이 서버의 사설 IP 10.30.0.20으로 바뀐다. IP 주소 변환에 집중한 예다.',
    640,
    text(32, 120, 'SNAT: 내부에서 외부로 나가는 요청', 24, c.ink, 'start', 600) +
      box(32, 150, 210, 92, '내부 클라이언트', '10.20.0.15') +
      box(350, 150, 200, 92, 'NAT 장비', '출발지 주소 변환', c.amber, c.amberInk) +
      box(658, 150, 210, 92, '외부 API', '203.0.113.80', c.green, c.greenInk) +
      arrow('M242 196H342') +
      arrow('M550 196H650') +
      label(450, 282, '출발지: 10.20.0.15 → 198.51.100.10') +
      text(32, 352, 'DNAT: 외부에서 내부 서버로 들어오는 요청', 24, c.ink, 'start', 600) +
      box(32, 382, 210, 92, '외부 클라이언트', '공인 주소로 요청') +
      box(350, 382, 200, 92, 'NAT 장비', '목적지 주소 변환', c.amber, c.amberInk) +
      box(658, 382, 210, 92, '내부 서버', '10.30.0.20', c.green, c.greenInk) +
      arrow('M242 428H342') +
      arrow('M550 428H650') +
      label(450, 514, '목적지: 198.51.100.10 → 10.30.0.20') +
      label(450, 581, '접속 허용 목록에는 상대가 보는 출발지 IP를 전달한다.') +
      label(450, 613, '입구와 출구의 공인 IP는 구성에 따라 다를 수 있다.')
  ),
  'vpn-tunnel.svg': svg(
    'VPN으로 허용된 내부 네트워크에 접근한다',
    '원격 개발자의 VPN 클라이언트가 인터넷 구간의 암호화 터널을 통해 VPN 게이트웨이에 접속한다. 내부 서버와 DB 중 권한과 네트워크 정책으로 허용된 자원만 사용한다.',
    480,
    label(450, 89, '외부 접속에 필요한 VPN 클라이언트와 게이트웨이를 구성한다.') +
      group(620, 122, 264, 294, '서버 네트워크') +
      box(32, 245, 210, 100, '원격 개발자', 'VPN 클라이언트') +
      box(350, 245, 218, 100, 'VPN 게이트웨이', '인증 · 연결 제어', c.amber, c.amberInk) +
      box(646, 180, 212, 92, '내부 서버', 'SSH 등 허용된 연결', c.green, c.greenInk) +
      box(646, 310, 212, 92, '내부 DB', '허용된 DB 연결', c.green, c.greenInk) +
      arrow('M242 295H342', true) +
      label(296, 228, '암호화 터널') +
      arrow('M568 295H606V226H638') +
      arrow('M606 295V356H638') +
      label(450, 456, 'VPN 연결 후에도 자원별 권한과 방화벽 정책을 확인한다.')
  ),
  'tcp-handshake.svg': svg(
    'TCP는 세 단계로 연결을 설정한다',
    '일반적인 TCP 연결 설정에서 클라이언트가 SYN을 보내고 서버가 SYN-ACK으로 응답한다. 클라이언트가 ACK을 보내 연결을 설정한다.',
    500,
    box(96, 120, 220, 84, '클라이언트') +
      box(576, 120, 220, 84, '서버', undefined, c.green, c.greenInk) +
      `<path d="M206 204V445M686 204V445" stroke="${c.line}" stroke-width="2"/>` +
      arrow('M206 255H678') +
      label(446, 236, '① SYN') +
      arrow('M686 335H214') +
      label(446, 316, '② SYN-ACK') +
      arrow('M206 415H678') +
      label(446, 396, '③ ACK') +
      label(450, 477, '일반적인 TCP 연결 설정의 세 단계다.')
  ),
  'http-transport.svg': svg(
    'HTTP/3는 QUIC 위에서 동작한다',
    'TCP 기반 HTTPS는 HTTP, TLS, TCP, IP로 구성된다. HTTP/3는 TLS를 통합한 QUIC을 사용하고 QUIC은 UDP 위에서 연결과 신뢰성 등을 제공한다.',
    565,
    label(450, 89, 'QUIC은 UDP 위에서 연결·재전송·암호화 등을 제공한다.') +
      text(227, 137, 'TCP 기반 HTTPS', 24, c.ink, 'middle', 600) +
      text(673, 137, 'QUIC 기반 HTTP/3', 24, c.ink, 'middle', 600) +
      [
        ['HTTP/1.1 · HTTP/2', 'HTTP/3', c.blue, c.blueInk],
        ['TLS', 'QUIC (TLS 통합)', c.green, c.greenInk],
        ['TCP', 'UDP', c.amber, c.amberInk],
        ['IP', 'IP', '#f5f7fa', c.muted],
      ]
        .map(([left, right, fill, ink], i) => {
          const y = 165 + i * 90
          return (
            box(56, y, 342, 64, left, undefined, fill, ink) +
            box(502, y, 342, 64, right, undefined, fill, ink) +
            (i < 3 ? arrow(`M227 ${y + 64}V${y + 82}`) + arrow(`M673 ${y + 64}V${y + 82}`) : '')
          )
        })
        .join('') +
      label(450, 540, '전송 프로토콜만으로 실제 응답 속도를 단정하지 않는다.')
  ),
}

await mkdir(root, { recursive: true })
for (const [name, content] of Object.entries(drawings)) {
  const target = path.join(root, name)
  await writeFile(target, content)
  console.log(target)
}
