import Link from 'next/link'
import { DISCLAIMER } from '@/data/site'

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto w-full max-w-3xl space-y-4 px-4 py-8">
        <p className="text-sm leading-relaxed text-ink-muted">{DISCLAIMER}</p>
        <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <Link href="/" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
            체크리스트
          </Link>
          <Link
            href="/guide/birth-report"
            className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            출생신고 가이드
          </Link>
          <Link
            href="/guide/subsidy"
            className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            출산 지원금 총정리
          </Link>
          <Link
            href="/guide/postpartum-care"
            className="text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          >
            산후도우미 가이드
          </Link>
          <Link href="/about" className="text-ink-muted underline-offset-2 hover:text-ink hover:underline">
            정보 출처·면책
          </Link>
        </nav>
        <p className="text-xs text-ink-muted">2026년 제도 기준 · 출생일은 이 기기에만 저장됩니다</p>
      </div>
    </footer>
  )
}
