/** 가이드(롱폼) 페이지 공용 타이포그래피 블록 */

import Link from 'next/link'
import type { ReactNode } from 'react'
import { ChevronRight } from 'lucide-react'

export function GuideTitle({ children, lead }: { children: ReactNode; lead: string }) {
  return (
    <header className="py-8">
      <h1 className="text-2xl font-bold leading-snug text-ink sm:text-3xl">{children}</h1>
      <p className="mt-3 leading-relaxed text-ink-body">{lead}</p>
    </header>
  )
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-xl font-bold text-ink">{children}</h2>
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-base font-semibold text-ink">{children}</h3>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 leading-relaxed text-ink-body">{children}</p>
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-2 pl-5 text-ink-body">{children}</ul>
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="mt-3 list-decimal space-y-2 pl-5 text-ink-body">{children}</ol>
}

export function B({ children }: { children: ReactNode }) {
  return <strong className="font-semibold text-ink">{children}</strong>
}

/** 체크리스트 항목으로 연결되는 카드형 링크 */
export function ItemLink({ slug, title, desc }: { slug: string; title: string; desc: string }) {
  return (
    <Link
      href={`/checklist/${slug}`}
      className="mt-3 flex items-center justify-between gap-3 rounded-sm border border-line bg-surface p-4 hover:border-line-strong"
    >
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-sm text-ink-muted">{desc}</span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
    </Link>
  )
}

export function GuideFaq({ faq }: { faq: { q: string; a: string }[] }) {
  return (
    <section className="mt-10 border-t border-line pt-6">
      <h2 className="text-xl font-bold text-ink">자주 묻는 질문</h2>
      <dl className="mt-4 space-y-5">
        {faq.map((f) => (
          <div key={f.q}>
            <dt className="font-semibold text-ink">Q. {f.q}</dt>
            <dd className="mt-1.5 leading-relaxed text-ink-body">{f.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function guideJsonLd(opts: {
  url: string
  title: string
  description: string
  faq: { q: string; a: string }[]
  datePublished: string
}) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: opts.title,
        description: opts.description,
        inLanguage: 'ko',
        mainEntityOfPage: opts.url,
        datePublished: opts.datePublished,
        dateModified: opts.datePublished,
      },
      {
        '@type': 'FAQPage',
        mainEntity: opts.faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  }
}
