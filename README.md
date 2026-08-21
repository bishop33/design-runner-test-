# design-runner-test

디자인 자동화 파이프라인을 검증하기 위한 테스트 저장소입니다. 실제 서비스와 무관합니다.

## 출산 후 행정 체크리스트 (이 브랜치)

이 브랜치에는 Next.js 15 기반의 공개 웹서비스 **출산 후 행정 체크리스트**가 들어 있습니다.
출생일(`?d=YYYY-MM-DD`)을 기준으로 출생신고·부모급여·산후도우미 등 27개 행정 절차의
마감일을 D-day로 계산합니다. 백엔드·로그인 없음 — 상태는 URL 쿼리와 localStorage에만 있습니다.

```bash
npm install
npm run dev     # 개발 서버
npm run build   # 프로덕션 빌드 (SSG 27개 상세 페이지 포함)
npm run start   # 프로덕션 서버
```

- **데이터 단일 소스**: `src/data/checklist.ts` — 제도가 바뀌면 이 파일만 수정합니다.
- 라우팅: `/` 체크리스트 · `/checklist/[slug]` 항목 상세(SSG) · `/guide/*` 롱폼 가이드 · `/about` 출처·면책
- SEO: 페이지별 metadata·canonical, JSON-LD(HowTo·FAQPage·ItemList), `sitemap.xml`·`robots.txt` 자동 생성, `/api/og` 동적 OG 이미지
- 디자인: `design-tokens.css`(brand-kb 사본)의 무채색 스케일·Signal 색을 기반으로 한 시맨틱 토큰(`src/app/globals.css`), 다크모드 지원, Pretendard 셀프호스팅(`public/fonts`)
- 배포 도메인이 정해지면 `NEXT_PUBLIC_SITE_URL` 환경변수 또는 `src/data/site.ts`를 갱신하세요.

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

## 보는 법

빌드 도구가 없습니다. 정적 파일을 그대로 엽니다.

```bash
cd ~/work/design-runner-test && python3 -m http.server 8082
```

## 규칙

- `main`에 직접 커밋하지 않습니다. 작업은 브랜치에서 합니다.
- 값은 토큰 변수로만 참조합니다. 리터럴 색·간격을 쓰지 않습니다.
- `design-tokens.css`는 brand-kb에서 내려온 사본이라 여기서 고치지 않습니다.
