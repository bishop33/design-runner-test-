# UI/UX 레퍼런스 — 팀 상비 목록

2026-08-21 리서치. 원문 접속이 프록시에 막힌 항목은 `[검색요약]` 으로 표시했고,
그 값은 팀에서 원문으로 재확인한 뒤 기준으로 승격합니다.

## 패턴 레퍼런스 — 언제 여는가

| 레퍼런스 | 언제 여는가 | 비고 |
|---|---|---|
| [Mobbin](https://mobbin.com) | 온보딩·체크리스트·기록 입력 같은 플로우의 실제 앱 스크린샷을 패턴별로 훑을 때 | 최대 규모. 무료는 최신 앱 4개 제한. 한국 앱 커버리지 약함 `[검색요약]` |
| [WWIT](https://wwit.design) | **한국 앱**(토스·당근 등) UI 를 플로우 단위로 볼 때 | Mobbin 의 한국 공백을 메우는 1순위 |
| [UIBOWL](https://uibowl.io) | 국내 패턴 + 한국어 UX 라이팅(푸시 문구 등) 사례 | `[검색요약]` |
| [Page Flows](https://pageflows.com) | 정지 화면이 아니라 **움직이는 인터랙션**을 봐야 할 때 | 무료 티어 없음. Screenlane 은 여기에 합병됨 `[검색요약]` |

## 평가 프레임워크 — 화면 리뷰 때 꺼내는 것

| 레퍼런스 | 용도 |
|---|---|
| [NN/g 10 Usability Heuristics](https://www.nngroup.com/articles/ten-usability-heuristics/) | 화면 리뷰 세션의 기본 체크리스트 |
| [GOV.UK Checkboxes](https://design-system.service.gov.uk/components/checkboxes/) | 체크 항목의 레이블·힌트·에러 상태 설계 |
| [GOV.UK One thing per page](https://designnotes.blog.gov.uk/2015/07/03/one-thing-per-page/) | 폼을 몇 단계로 쪼갤지 결정할 때 |
| [WCAG 2.2 SC 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | 터치 타깃 QA `[검색요약]` |
| [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/) · [Material](https://m3.material.io) | iOS·Android 관례 확인 `[검색요약]` |

## 한국어 타이포·디자인 시스템 운영

| 레퍼런스 | 용도 |
|---|---|
| [KRDS 타이포그래피](https://www.krds.go.kr/html/site/style/style_03.html) | 한글 본문 크기·행간의 공적 기준 `[접속 차단 — 직접 확인 필요]` |
| [Toss Tech — 디자인 시스템](https://toss.tech/article/toss-design-system) · [TDS Mobile](https://tossmini-docs.toss.im/tds-mobile/) | 토큰·컴포넌트 운영 철학과 실제 스펙 |
| [우아한형제들 — 셀프서비스 디자인시스템 #1](https://techblog.woowahan.com/6305/) · [#2](https://techblog.woowahan.com/5327/) | 소규모 팀의 시스템 구축 실무기 |
| [한글 웹 타이포](https://lqez.github.io/blog/hangul-typo-on-web.html) | keep-all·행간 등 CSS 수준 논의 |

## 헬스케어 도메인 — 문구 톤

| 레퍼런스 | 용도 |
|---|---|
| [NHS Voice and tone](https://service-manual.nhs.uk/content/voice-and-tone) | 의료 문구의 톤. 불안 상황별 화법 |
| [NHS How we write](https://service-manual.nhs.uk/content/how-we-write) | 문장 길이·읽기 수준의 구체 규칙 |

임신 도메인 전용 톤 가이드는 공개된 것을 찾지 못했고, NHS 가 가장 근접한 대체재입니다.

## 우리 앱 대조 결과 (2026-08-21)

| 기준 | 출처 | 우리 상태 |
|---|---|---|
| 터치 타깃 최소 24px(AA)·44px(AAA)·48dp(Material) | WCAG 2.5.8/2.5.5, Material | **통과** — 팀 기준 44px, 실측 상태 원 48, 행 64px |
| 한글 단어 단위 줄바꿈 `word-break: keep-all` | 한글 웹 타이포 | **적용 완료** (d2d8c04) |
| 한글 본문 행간 1.5~1.6 | 국내 실무 통설 | **통과** — body 1.6, 제목 1.3~1.45 |
| 고딕 UI 음수 자간 -0.01~-0.02em | 관행(추측) | **통과** — 제목에 적용, 본문은 기본 |
| 폼 한 페이지 한 질문 | GOV.UK | **의도적 미적용** — 온보딩을 날짜 2개+접힌 상황 질문 1페이지로 유지. 리텐션 리서치의 "입력 비용 최소화" 와 상충해 후자를 택함. 사용자 이탈 데이터가 생기면 재검토 |
| 의료 문구: 문장 20단어 이하, 안심 프레이밍 | NHS `[검색요약]` | **콘텐츠 집필 규칙으로 채택** — 시트 원고를 쓸 때 적용. 현재 템플릿 문구는 통과 |
| 폰트 스택에 한글 폴백 명시 | iOS Apple SD Gothic Neo | **토큰 논의 필요** — `--font-sans` 에 한글 폴백이 없음. `-apple-system`/`system-ui` 가 사실상 처리하지만 명시가 안전. design-tokens.css 는 이 레포에서 수정 금지라 brand-kb 에 제안 |

## 우리 환경의 디자인 도구 (점검 완료)

- **Figma MCP** — DeepSearch 팀 계정(Pro) 인증 완료. code-to-design(앱 화면 → Figma 파일)과 design-to-code 양방향 가능
- **Claude Design 캔버스**(`design` 스킬) — 손으로 수정 가능한 목업 아트보드
- **`dataviz` 스킬** — 차트·통계 타일 (추후 준비 현황 그래프)
- **조직 스킬 `listing-ux-writer`** — 다른 제품용이지만, 우리 앱용 UX 라이팅 스킬을 같은 패턴으로 만들 수 있음
