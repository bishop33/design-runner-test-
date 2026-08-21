/**
 * 데이터 파일의 detail 마크다운을 렌더링하는 최소 파서.
 * 지원: ## / ### 제목, - 목록, 1. 목록, **강조**, [링크](url), 단락.
 * 외부 의존성을 피하기 위해 필요한 문법만 구현합니다.
 */

import type { ReactNode } from 'react'

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  // **bold** 와 [label](url) 만 처리
  const nodes: ReactNode[] = []
  const re = /\*\*(.+?)\*\*|\[([^\]]+)\]\(([^)]+)\)/g
  let last = 0
  let m: RegExpExecArray | null
  let i = 0
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      nodes.push(
        <strong key={`${keyPrefix}-b${i}`} className="font-semibold text-ink">
          {m[1]}
        </strong>,
      )
    } else {
      nodes.push(
        <a
          key={`${keyPrefix}-a${i}`}
          href={m[3]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent underline underline-offset-2"
        >
          {m[2]}
        </a>,
      )
    }
    last = m.index + m[0].length
    i++
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n{2,}/)
  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => {
        const lines = block.split('\n')
        // 제목
        if (/^###\s/.test(block)) {
          return (
            <h3 key={bi} className="pt-2 text-base font-semibold text-ink">
              {renderInline(block.replace(/^###\s*/, ''), `h3-${bi}`)}
            </h3>
          )
        }
        if (/^##\s/.test(block)) {
          return (
            <h2 key={bi} className="pt-4 text-lg font-bold text-ink">
              {renderInline(block.replace(/^##\s*/, ''), `h2-${bi}`)}
            </h2>
          )
        }
        // 목록 (블록 전체가 목록 항목일 때)
        if (lines.every((l) => /^[-*]\s/.test(l))) {
          return (
            <ul key={bi} className="list-disc space-y-2 pl-5 text-ink-body">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^[-*]\s*/, ''), `li-${bi}-${li}`)}</li>
              ))}
            </ul>
          )
        }
        if (lines.every((l) => /^\d+\.\s/.test(l))) {
          return (
            <ol key={bi} className="list-decimal space-y-2 pl-5 text-ink-body">
              {lines.map((l, li) => (
                <li key={li}>{renderInline(l.replace(/^\d+\.\s*/, ''), `oli-${bi}-${li}`)}</li>
              ))}
            </ol>
          )
        }
        // 일반 단락 (줄바꿈은 공백으로)
        return (
          <p key={bi} className="leading-relaxed text-ink-body">
            {renderInline(lines.join(' '), `p-${bi}`)}
          </p>
        )
      })}
    </div>
  )
}

/** JSON-LD의 HowTo/설명용 — 마크다운 표기를 제거한 플레인 텍스트 */
export function stripMarkdown(source: string): string {
  return source
    .replace(/^#{2,3}\s*/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/^[-*]\s*/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
