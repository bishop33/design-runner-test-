import Link from 'next/link'
import { Baby } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-ink">
          <Baby className="size-5 text-accent" aria-hidden />
          <span>출산 후 체크리스트</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link
            href="/guide/birth-report"
            className="hidden rounded-sm px-2 py-1.5 text-sm text-ink-muted hover:text-ink sm:block"
          >
            출생신고
          </Link>
          <Link
            href="/guide/subsidy"
            className="hidden rounded-sm px-2 py-1.5 text-sm text-ink-muted hover:text-ink sm:block"
          >
            지원금
          </Link>
          <Link
            href="/guide/postpartum-care"
            className="hidden rounded-sm px-2 py-1.5 text-sm text-ink-muted hover:text-ink sm:block"
          >
            산후도우미
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}
