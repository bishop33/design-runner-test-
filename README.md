# design-runner-test

디자인 자동화 파이프라인을 검증하기 위한 테스트 저장소입니다. 실제 서비스와 무관합니다.

## 무엇을 검증하나

지라 티켓 하나가 브랜치 · 작업 · 드래프트 PR까지 사람 손 없이 도달하는지 확인합니다.
러너는 이 저장소가 아니라 별도 위치(`~/work/design-runner`)에 있습니다.

## 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 단일 랜딩 페이지 |
| `styles.css` | 페이지 스타일 — 토큰을 소비 |
| `design-tokens.css` | 색·타이포·간격·모션의 확정 값 (brand-kb 사본, **수정 금지**) |
| `design-rules.md` | 시각·문구 판단 기준 |
| `AGENTS.md` | 에이전트가 작업 전에 읽는 지침 |
| `app/` | 준비 — 임신·출산·육아 체크리스트 MVP (아래) |
| `tools/` | 시트 CSV 스냅샷과 변환 스크립트 |
| `docs/` | 기획·데이터 분석 문서 |

## 보는 법

빌드 도구가 없습니다. 정적 파일을 그대로 엽니다.

```bash
cd ~/work/design-runner-test && python3 -m http.server 8082
```

랜딩 페이지는 <http://localhost:8082/>, 앱은 <http://localhost:8082/app/> 입니다.
`file://` 로 열면 콘텐츠 JSON 을 읽지 못하므로 정적 서버가 필요합니다.

---

## 준비 — 임신부터 출산 후 24개월까지

임신부터 출산 후 24개월까지 해야 할 일을 시기별로 확인하고 부부가 함께 기록하는 모바일 웹 MVP입니다.
[구글 시트](https://docs.google.com/spreadsheets/d/1kC-AZzhLd43BWOjHFNejDOtN7USQxusJK0Obw8jr0uo/htmlview)
356개 항목을 그대로 불러와 씁니다. 기획과 데이터 분석은 [docs/service-plan.md](docs/service-plan.md)에 있습니다.

```
app/
  index.html          앱 셸
  app.css             앱 스타일 — design-tokens.css 를 소비
  data/content.json   시트에서 생성한 콘텐츠 원본 (읽기 전용)
  src/
    app.js            해시 라우터
    dates.js          기준일 기반 일정 계산
    store.js          사용자 상태 (localStorage 어댑터)
    model.js          콘텐츠 + 상태 결합, 개인화, 우선순위
    ui.js             상태·중요도·유형의 시각 체계
    icons.js          Lucide 아이콘 path
    views/            9개 화면
tools/
  content.source.csv  시트 CSV 스냅샷
  sheet-to-content.py 스냅샷 → app/data/content.json
```

시트를 고친 뒤 앱에 반영하려면 CSV를 다시 내려받아 `tools/content.source.csv` 로 덮고 실행합니다.

```bash
python3 tools/sheet-to-content.py
```

### 파일 하나로 묶기

서버 없이 열거나 링크로 공유해야 하면 전부 인라인한 단일 파일을 만듭니다.

```bash
python3 tools/build-standalone.py
```

| 출력 | 쓰임 |
|---|---|
| `dist/junbi.html` | 브라우저로 바로 여는 완성 문서 (`file://` 로도 동작) |
| `dist/junbi.artifact.html` | `<head>`/`<body>` 를 감싸 주는 환경용 조각 |

번들러를 설치하지 않으려고 직접 묶습니다. 모듈마다 함수로 감싸 스코프를 유지하므로
이름이 섞이지 않습니다. `dist/` 는 생성물이라 커밋하지 않습니다.

### 원칙

- 콘텐츠 원본과 사용자 상태를 분리합니다. `content.json` 에는 완료 여부·메모를 쓰지 않습니다.
- 일정은 출산 예정일·입원일·출생일에서 계산합니다. 콘텐츠에 날짜를 넣지 않습니다.
- 의료·지원 정책·비용을 임의로 만들지 않습니다. 원본에 값이 없으면 `확인 필요`로 둡니다.
- 저장은 `store.js` 의 `loadState`/`saveState` 뒤에 있어 DB로 옮길 때 두 함수만 바꿉니다.

## 규칙

- `main`에 직접 커밋하지 않습니다. 작업은 브랜치에서 합니다.
- 값은 토큰 변수로만 참조합니다. 리터럴 색·간격을 쓰지 않습니다.
- `design-tokens.css`는 brand-kb에서 내려온 사본이라 여기서 고치지 않습니다.
