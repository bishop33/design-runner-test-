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

## 보는 법

빌드 도구가 없습니다. 정적 파일을 그대로 엽니다.

```bash
cd ~/work/design-runner-test && python3 -m http.server 8082
```

## 규칙

- `main`에 직접 커밋하지 않습니다. 작업은 브랜치에서 합니다.
- 값은 토큰 변수로만 참조합니다. 리터럴 색·간격을 쓰지 않습니다.
- `design-tokens.css`는 brand-kb에서 내려온 사본이라 여기서 고치지 않습니다.
