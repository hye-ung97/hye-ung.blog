import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/static/images/books/junior-backend-practical-knowledge/ch08')
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
  'token-storage.svg': svg(
    '사용자 식별 정보를 어디에 보관할까?',
    '서버 저장 방식은 임의 토큰으로 공유 저장소의 사용자 정보를 조회한다. JWT 방식은 서버가 서명과 유효성을 검증한 뒤 토큰에 담긴 사용자 식별자를 구한다.',
    500,
    label(450, 89, '어느 방식이든 서버가 토큰을 검증한 뒤 사용자를 식별한다.') +
      text(32, 139, '서버 저장 방식', 24, c.ink, 'start', 600) +
      box(32, 165, 210, 92, '클라이언트', '임의 토큰') +
      box(350, 165, 200, 92, '서버', '저장소 조회') +
      box(658, 165, 210, 92, '공유 저장소', '토큰 → 사용자', c.green, c.greenInk) +
      arrow('M242 211H342') +
      arrow('M550 211H650') +
      text(32, 321, '토큰에 정보를 담는 방식', 24, c.ink, 'start', 600) +
      box(32, 347, 210, 92, '클라이언트', '서명된 JWT') +
      box(350, 347, 200, 92, '서버', '서명 · 유효성 검증') +
      box(658, 347, 210, 92, '검증한 토큰', '사용자 식별자', c.green, c.greenInk) +
      arrow('M242 393H342') +
      arrow('M550 393H650') +
      label(450, 477, '토큰 발급 이후의 만료와 무효화 정책도 함께 정한다.')
  ),
  'authorization.svg': svg(
    '로그인한 사용자라도 권한은 따로 확인한다',
    '서버가 인증한 사용자 정보를 기준으로 기능 실행 권한과 해당 예약에 대한 접근 권한을 검사한다. 모든 검사를 통과한 요청만 업무를 처리한다.',
    450,
    label(450, 89, '요청 파라미터의 사용자 ID를 그대로 신뢰하지 않는다.') +
      box(32, 159, 210, 100, '인증된 사용자', '서버가 확인한 주체') +
      box(344, 125, 230, 92, '기능 권한 검사', '기능 실행이 가능한가?', c.green, c.greenInk) +
      box(344, 295, 230, 92, '자원 권한 검사', '접근 가능한 예약인가?', c.green, c.greenInk) +
      box(660, 295, 208, 92, '업무 처리', '검사를 통과한 요청') +
      arrow('M242 209H290V171H336') +
      arrow('M459 217V287') +
      label(504, 259, '통과') +
      arrow('M574 341H652') +
      label(613, 319, '통과') +
      text(32, 415, '검사에 실패하면 요청을 거부한다.', 22, c.muted)
  ),
  'hash-salt.svg': svg(
    '같은 비밀번호도 솔트가 다르면 저장값이 달라진다',
    '같은 원문이라도 서로 다른 솔트로 해시를 계산하면 서로 다른 저장값을 얻는다. 로그인 검증에는 저장된 솔트와 같은 알고리즘 설정을 사용한다.',
    480,
    label(450, 89, '같은 원문을 서로 다른 솔트와 함께 처리한 개념도다.') +
      box(32, 142, 210, 92, '같은 비밀번호', '입력 원문') +
      box(342, 142, 218, 92, '단방향 변환', '솔트 A 사용', c.amber, c.amberInk) +
      box(660, 142, 208, 92, '저장값 A', undefined, c.green, c.greenInk) +
      arrow('M242 188H334') +
      arrow('M560 188H652') +
      box(32, 286, 210, 92, '같은 비밀번호', '입력 원문') +
      box(342, 286, 218, 92, '단방향 변환', '솔트 B 사용', c.amber, c.amberInk) +
      box(660, 286, 208, 92, '저장값 B', undefined, c.green, c.greenInk) +
      arrow('M242 332H334') +
      arrow('M560 332H652') +
      label(450, 422, '솔트는 해시 및 알고리즘 설정과 함께 보관한다.') +
      label(450, 455, '로그인 시에는 저장된 조건으로 입력한 비밀번호를 검증한다.')
  ),
  'encryption-keys.svg': svg(
    '복원이 필요한 정보는 키로 암호화한다',
    '대칭 키 암호화는 같은 비밀 키로 암호화하고 복호화한다. 공개 키 암호화는 수신자의 공개 키로 암호화하고 수신자의 개인 키로 복호화한다. 전자서명과는 구분한다.',
    560,
    text(32, 126, '대칭 키: 같은 비밀 키로 암호화와 복호화', 24, c.ink, 'start', 600) +
      box(32, 180, 148, 84, '원문') +
      box(365, 180, 170, 84, '암호문', undefined, c.amber, c.amberInk) +
      box(690, 180, 178, 84, '복원한 원문', undefined, c.green, c.greenInk) +
      arrow('M180 222H357') +
      arrow('M535 222H682') +
      label(273, 168, '비밀 키로 암호화') +
      label(613, 168, '같은 키로 복호화') +
      text(32, 337, '공개 키: 수신자의 공개 키와 개인 키 사용', 24, c.ink, 'start', 600) +
      box(32, 390, 148, 84, '원문') +
      box(365, 390, 170, 84, '암호문', undefined, c.amber, c.amberInk) +
      box(690, 390, 178, 84, '복원한 원문', undefined, c.green, c.greenInk) +
      arrow('M180 432H357') +
      arrow('M535 432H682') +
      label(273, 378, '수신자 공개 키') +
      label(613, 378, '수신자 개인 키') +
      label(450, 531, '전자서명은 개인 키로 서명하고 공개 키로 검증하는 별도의 연산이다.')
  ),
  'hmac.svg': svg(
    'HMAC은 공유 비밀 키로 메시지를 검증한다',
    '송신자가 메시지와 공유 비밀 키로 MAC을 계산해 메시지와 함께 보낸다. 수신자는 같은 메시지와 키로 MAC을 다시 계산하고 받은 MAC과 비교한다.',
    570,
    box(32, 132, 290, 94, '송신자', '메시지 + 공유 비밀 키') +
      box(578, 132, 290, 94, '수신자', '받은 메시지 + 같은 키') +
      arrow('M177 226V302') +
      label(177, 274, 'HMAC 계산') +
      box(32, 310, 290, 84, 'MAC A', undefined, c.amber, c.amberInk) +
      arrow('M322 352H450V179H570') +
      label(450, 113, '메시지 + MAC A 전송') +
      arrow('M723 226V302') +
      label(723, 274, 'HMAC 재계산') +
      box(578, 310, 290, 84, 'MAC B', undefined, c.green, c.greenInk) +
      arrow('M177 394V462H342') +
      arrow('M723 394V462H558') +
      box(350, 422, 200, 80, 'A와 B 비교') +
      label(450, 544, '같은 메시지와 같은 비밀 키를 사용했는지 확인한다.')
  ),
  'network-boundary.svg': svg(
    '네트워크 경계에서도 필요한 연결만 허용한다',
    '방화벽은 출발지와 목적지, 포트 등의 정책으로 연결을 제한한다. 서비스 HTTPS는 외부에 열되 관리 기능은 허용한 대역으로 제한하고 나머지는 차단한다. 아웃바운드도 필요한 목적지만 허용한다.',
    530,
    label(450, 89, '서비스와 관리 기능에 서로 다른 접근 정책을 적용한다.') +
      box(32, 132, 210, 92, '일반 사용자', '서비스 접근') +
      box(32, 280, 210, 92, '관리 허용 대역', '관리 기능 접근') +
      box(350, 188, 208, 132, '방화벽 정책', 'IP · 포트 정책', c.amber, c.amberInk) +
      box(658, 132, 210, 92, '서비스 HTTPS', '필요한 포트만', c.green, c.greenInk) +
      box(658, 280, 210, 92, '관리 기능', '허용 대역만', c.green, c.greenInk) +
      arrow('M242 178H294V224H342') +
      arrow('M242 326H294V286H342') +
      arrow('M558 224H606V178H650') +
      arrow('M558 286H606V326H650') +
      label(450, 409, '정책에 맞지 않는 연결은 차단한다.') +
      box(32, 437, 836, 66, '아웃바운드도 필요한 목적지로 제한한다', undefined)
  ),
  'server-masking.svg': svg(
    '민감 정보는 API 응답을 만들 때부터 가린다',
    '서버가 사용자 권한을 확인하고 필요한 데이터만 마스킹해 응답한다. 클라이언트에는 이미 마스킹한 데이터가 전달된다. 화면에서만 가리면 API 응답에 원문이 남는다.',
    410,
    label(450, 89, '브라우저에 원문을 보낸 다음 화면에서만 가리지 않는다.') +
      box(32, 160, 210, 100, '민감 원본', '서버가 보관하는 정보', c.amber, c.amberInk) +
      box(350, 160, 210, 100, '서버', '권한 확인 · 마스킹') +
      box(666, 160, 202, 100, '클라이언트', '가려진 값 표시', c.green, c.greenInk) +
      arrow('M242 210H342') +
      arrow('M560 210H658') +
      label(611, 143, '가려진 응답') +
      label(450, 326, '응답 예: {"phone":"010-****-2468"}') +
      label(450, 377, '화면에서만 가리면 API 응답에 원문이 남는다.')
  ),
}

await mkdir(root, { recursive: true })
for (const [name, content] of Object.entries(drawings)) {
  const target = path.join(root, name)
  await writeFile(target, content)
  console.log(target)
}
