import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve('public/static/images/books/junior-backend-practical-knowledge')
const colors = {
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
const text = (x, y, value, size = 24, color = colors.ink, anchor = 'start', weight = 400) =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" text-anchor="${anchor}" font-weight="${weight}">${escape(value)}</text>`
const box = (x, y, w, h, title, detail, fill = colors.blue, ink = colors.blueInk) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="13" fill="${fill}" stroke="${colors.line}"/>` +
  text(x + w / 2, y + (detail ? 36 : h / 2 + 8), title, 25, ink, 'middle', 600) +
  (detail ? text(x + w / 2, y + 68, detail, 21, ink, 'middle') : '')
const arrow = (d, dashed = false) =>
  `<path d="${d}" fill="none" stroke="${colors.muted}" stroke-width="2.5" marker-end="url(#arrow)"${dashed ? ' stroke-dasharray="7 5"' : ''}/>`
const label = (x, y, value) => text(x, y, value, 21, colors.muted, 'middle')
const svg = (title, desc, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${h}" viewBox="0 0 900 ${h}" role="img" aria-labelledby="title desc">
<title id="title">${escape(title)}</title><desc id="desc">${escape(desc)}</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="${colors.muted}"/></marker></defs>
<rect width="900" height="${h}" rx="18" fill="#fff"/>
<g font-family="'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">
${text(32, 49, title, 29, colors.ink, 'start', 700)}
${body}
</g></svg>\n`

const drawings = {
  'ch11/mvc.svg': svg(
    'MVC: 요청 처리와 결과 표현을 나눈다',
    '컨트롤러가 요청을 해석해 모델을 실행하고 뷰를 선택한다. 모델은 업무 로직을, 뷰는 응답 생성을 맡는다.',
    470,
    label(450, 89, '모델은 HTML이나 화면 이동을 알 필요가 없다.') +
      box(32, 177, 168, 100, '사용자', '요청 · 응답', colors.green, colors.greenInk) +
      box(302, 143, 218, 100, '컨트롤러', '입력 해석 · 흐름 제어') +
      box(650, 143, 218, 100, '모델', '업무 로직 실행', colors.green, colors.greenInk) +
      box(302, 323, 218, 100, '뷰', 'HTML · JSON 생성', colors.amber, colors.amberInk) +
      arrow('M200 205H294') +
      label(248, 185, '① 요청') +
      arrow('M520 193H642') +
      label(583, 173, '② 실행') +
      arrow('M411 243V315') +
      text(435, 284, '③ 선택 · 데이터 전달', 21, colors.muted) +
      arrow('M302 373H116V285') +
      label(187, 401, '④ 응답')
  ),
  'ch11/layers.svg': svg(
    '계층마다 맡은 역할과 의존 방향을 정한다',
    '표현, 응용, 도메인, 인프라의 네 계층을 하향 의존으로 구성한 예다. 업무 규칙은 도메인에 모은다.',
    610,
    label(450, 90, '아래는 바로 하위 계층에 의존하는 구성의 예다.') +
      [
        ['표현', '요청 해석 · 응답 생성', colors.blue, colors.blueInk],
        ['응용', '사용 사례의 실행 순서 조율', colors.blue, colors.blueInk],
        ['도메인', '취소 조건 · 상태 변경 규칙', colors.green, colors.greenInk],
        ['인프라', 'DB 접근 · 외부 연동 구현', colors.amber, colors.amberInk],
      ]
        .map(([name, detail, fill, ink], i) => {
          const y = 124 + i * 111
          return (
            `<rect x="90" y="${y}" width="720" height="82" rx="13" fill="${fill}" stroke="${colors.line}"/>` +
            text(230, y + 49, name, 25, ink, 'middle', 600) +
            text(345, y + 49, detail, 24, ink) +
            (i < 3 ? arrow(`M230 ${y + 82}V${y + 103}`) : '')
          )
        })
        .join('') +
      label(450, 581, '도메인 규칙이 컨트롤러와 SQL에 흩어지지 않게 살핀다.')
  ),
  'ch11/events.svg': svg(
    '이벤트로 이미 일어난 사실을 전달한다',
    '생산자가 예약 확정 이벤트를 브로커에 발행한다. 브로커가 관심 있는 이용 준비와 알림 소비자에 전달한다.',
    420,
    label(450, 90, '생산자는 개별 소비자를 직접 호출하지 않는다.') +
      box(32, 190, 210, 100, '이벤트 생산자', '예약 서비스') +
      box(350, 190, 200, 100, '이벤트 브로커', '전달 · 라우팅', colors.amber, colors.amberInk) +
      box(666, 126, 202, 92, '이벤트 소비자', '이용 준비', colors.green, colors.greenInk) +
      box(666, 274, 202, 92, '이벤트 소비자', '확정 알림', colors.green, colors.greenInk) +
      arrow('M242 240H342') +
      label(297, 170, '예약 확정됨') +
      arrow('M550 240H604V172H658') +
      arrow('M604 240V320H658') +
      label(450, 393, '처리 완료 여부를 추적하려면 별도 관찰 수단이 필요하다.')
  ),
  'ch11/cqrs.svg': svg(
    'CQRS: 변경과 조회에 맞는 모델을 따로 둔다',
    '변경 요청은 명령 모델을 거쳐 DB를 수정하고, 조회 모델은 같은 DB에서 화면에 필요한 데이터를 읽는다. 별도 DB는 필수가 아니다.',
    434,
    label(450, 89, '하나의 DB를 공유하면서 모델만 분리할 수도 있다.') +
      box(32, 132, 180, 84, '변경 요청', undefined, colors.green, colors.greenInk) +
      box(32, 293, 180, 84, '조회 요청') +
      box(305, 132, 240, 84, '명령 모델', '규칙 검증 · 상태 변경', colors.green, colors.greenInk) +
      box(305, 293, 240, 84, '조회 모델', '화면에 필요한 데이터') +
      box(705, 207, 163, 100, '공유 DB', '저장소', colors.amber, colors.amberInk) +
      arrow('M212 174H297') +
      arrow('M212 335H297') +
      arrow('M545 174H786V199') +
      label(623, 154, '쓰기') +
      arrow('M786 307V335H553') +
      label(624, 365, '읽기')
  ),
  'appendix-a/load-types.svg': svg(
    '부하가 늘어도 처리량이 계속 늘지는 않는다',
    '부하가 증가하면 처리량이 늘다가 포화점에 도달한다. 한계를 넘어서면 처리량이 감소할 수 있다. 실측값이 없는 개념도다.',
    445,
    label(450, 88, '개념도 · 실제 측정값이 아닌 처리량 변화의 예') +
      `<rect x="591" y="126" width="244" height="232" rx="10" fill="${colors.amber}"/>` +
      arrow('M84 358H850') +
      arrow('M84 358V125') +
      text(41, 124, '처리량', 22, colors.muted) +
      text(815, 393, '부하 →', 22, colors.muted) +
      `<path d="M105 338C220 300 295 225 392 186C480 150 535 150 590 150C650 150 730 210 815 315" fill="none" stroke="${colors.greenInk}" stroke-width="5"/>` +
      `<path d="M590 150V358" stroke="${colors.muted}" stroke-width="2" stroke-dasharray="7 5"/>` +
      `<circle cx="590" cy="150" r="7" fill="${colors.greenInk}"/>` +
      text(568, 127, '포화점', 23, colors.greenInk, 'end', 600) +
      text(712, 178, '버클존', 24, colors.amberInk, 'middle', 600) +
      label(450, 423, '목표에 못 미치면 병목을 찾고 개선한 뒤 다시 측정한다.')
  ),
  'appendix-a/test-topology.svg': svg(
    '부하를 만드는 장비와 처리하는 장비를 나눈다',
    '독립 부하 발생기가 테스트 대상에 요청을 보내며, 외부 연동은 대역으로 대체한다. 대상의 자원과 응답 지표를 함께 수집한다.',
    428,
    box(32, 142, 222, 100, '부하 발생기', '독립 장비') +
      box(350, 142, 218, 100, '테스트 대상', '운영과 유사한 구성', colors.green, colors.greenInk) +
      box(665, 142, 203, 100, '외부 연동 대역', '실제 서비스 대신', colors.amber, colors.amberInk) +
      arrow('M254 192H342') +
      label(301, 127, '요청') +
      arrow('M568 192H657') +
      label(615, 127, '연동') +
      arrow('M459 242V305') +
      arrow('M143 242V352H192', true) +
      box(200, 313, 600, 78, '지표 수집', '응답 시간 · 처리량 · 오류율 · CPU · 메모리') +
      label(450, 87, '외부 서비스에 시험 부하가 전달되지 않게 구성한다.')
  ),
  'appendix-a/iteration.svg': svg(
    '실행하고, 원인을 찾고, 같은 조건에서 비교한다',
    '부하 실행, 지표 수집과 병목 분석, 원인 수정, 동일 조건 재측정을 반복한다.',
    418,
    box(50, 125, 330, 90, '1. 부하 실행', '정한 시나리오 · 목표 부하') +
      box(
        520,
        125,
        330,
        90,
        '2. 지표와 병목 분석',
        '대상 서버 · DB · 부하기',
        colors.green,
        colors.greenInk
      ) +
      box(
        520,
        280,
        330,
        90,
        '3. 원인 수정',
        '병목에 맞는 개선 적용',
        colors.amber,
        colors.amberInk
      ) +
      box(50, 280, 330, 90, '4. 동일 조건 재측정', '목표 충족 여부 비교') +
      arrow('M380 170H512') +
      arrow('M685 215V272') +
      arrow('M520 325H388') +
      arrow('M215 280V223') +
      label(450, 89, '목표 성능을 얻을 때까지 측정과 분석을 반복한다.')
  ),
}

for (const [name, content] of Object.entries(drawings)) {
  const target = path.join(root, name)
  await mkdir(path.dirname(target), { recursive: true })
  await writeFile(target, content)
  console.log(target)
}
