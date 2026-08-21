import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  CalendarClock,
  ExternalLink,
  FileText,
  MapPin,
} from 'lucide-react'
import { CATEGORY_LABELS, CHECKLIST_ITEMS, getItemBySlug } from '@/data/checklist'
import { SITE_NAME, SITE_URL } from '@/data/site'
import { Markdown, stripMarkdown } from '@/lib/markdown'
import { ItemDdayNotice } from '@/components/ItemDdayNotice'

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return CHECKLIST_ITEMS.map((item) => ({ slug: item.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const item = getItemBySlug(slug)
  if (!item) return {}
  const title = item.offsetLabel ? `${item.title} — ${item.offsetLabel}` : item.title
  return {
    title,
    description: item.shortDesc,
    alternates: { canonical: `/checklist/${item.slug}` },
    openGraph: {
      title: `${item.title} | ${SITE_NAME}`,
      description: item.shortDesc,
      url: `/checklist/${item.slug}`,
      images: [{ url: `/api/og?slug=${item.slug}`, width: 1200, height: 630 }],
    },
  }
}

export default async function ChecklistDetailPage({ params }: Props) {
  const { slug } = await params
  const item = getItemBySlug(slug)
  if (!item) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'HowTo',
        name: item.title,
        description: item.shortDesc,
        inLanguage: 'ko',
        step: [
          ...(item.documents.length > 0
            ? [
                {
                  '@type': 'HowToStep',
                  name: '서류 준비',
                  text: `필요 서류: ${item.documents.join(', ')}`,
                },
              ]
            : []),
          {
            '@type': 'HowToStep',
            name: '신청·처리',
            text: `처리 장소: ${item.where}. ${stripMarkdown(item.detail).slice(0, 300)}`,
          },
        ],
      },
      ...(item.faq.length > 0
        ? [
            {
              '@type': 'FAQPage',
              mainEntity: item.faq.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            },
          ]
        : []),
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '체크리스트', item: SITE_URL },
          {
            '@type': 'ListItem',
            position: 2,
            name: item.title,
            item: `${SITE_URL}/checklist/${item.slug}`,
          },
        ],
      },
    ],
  }

  return (
    <article className="py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link
        href="/"
        className="flex items-center gap-1 text-sm text-ink-muted underline-offset-2 hover:text-ink hover:underline"
      >
        <ArrowLeft className="size-4" aria-hidden />
        전체 체크리스트
      </Link>

      <header className="mt-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 font-medium text-ink-muted">
            {CATEGORY_LABELS[item.category]}
          </span>
          {item.critical && (
            <span className="flex items-center gap-1 rounded-pill bg-danger-surface px-2 py-0.5 font-semibold text-danger">
              <AlertTriangle className="size-3" aria-hidden />
              놓치면 손해
            </span>
          )}
          {item.varies && (
            <span className="flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 font-medium text-ink-muted">
              <MapPin className="size-3" aria-hidden />
              지자체별 상이
            </span>
          )}
        </div>
        <h1 className="mt-3 text-2xl font-bold leading-snug text-ink sm:text-3xl">{item.title}</h1>
        <p className="mt-2 leading-relaxed text-ink-body">{item.shortDesc}</p>
      </header>

      <div className="mt-6">
        <ItemDdayNotice item={item} />
      </div>

      {/* 핵심 정보 */}
      <dl className="mt-6 space-y-3 rounded-lg border border-line bg-surface p-4 text-sm sm:p-6">
        <div className="flex gap-3">
          <dt className="flex w-20 shrink-0 items-center gap-1.5 font-semibold text-ink-muted">
            <CalendarClock className="size-4" aria-hidden />
            기한
          </dt>
          <dd className="text-ink">
            {item.offsetLabel ?? (item.offsetDays !== null ? `출생 후 ${item.offsetDays}일` : '기한 없음')}
          </dd>
        </div>
        <div className="flex gap-3">
          <dt className="flex w-20 shrink-0 items-center gap-1.5 font-semibold text-ink-muted">
            <MapPin className="size-4" aria-hidden />
            처리처
          </dt>
          <dd className="text-ink">{item.where}</dd>
        </div>
        {item.amount && (
          <div className="flex gap-3">
            <dt className="flex w-20 shrink-0 items-center gap-1.5 font-semibold text-ink-muted">
              <Banknote className="size-4" aria-hidden />
              지원
            </dt>
            <dd className="text-ink">{item.amount}</dd>
          </div>
        )}
        {item.documents.length > 0 && (
          <div className="flex gap-3">
            <dt className="flex w-20 shrink-0 items-center gap-1.5 font-semibold text-ink-muted">
              <FileText className="size-4" aria-hidden />
              서류
            </dt>
            <dd className="text-ink">
              <ul className="list-disc space-y-1 pl-4">
                {item.documents.map((doc) => (
                  <li key={doc}>{doc}</li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      {/* 공식 출처 */}
      {item.officialLinks.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-ink-muted">공식 출처</h2>
          <ul className="mt-2 space-y-2">
            {item.officialLinks.map((link) => (
              <li key={link.url}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm font-medium text-accent underline underline-offset-2"
                >
                  {link.label}
                  <ExternalLink className="size-3.5 shrink-0" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 본문 */}
      <section className="mt-8 border-t border-line pt-6">
        <Markdown source={item.detail} />
      </section>

      {/* FAQ */}
      {item.faq.length > 0 && (
        <section className="mt-8 border-t border-line pt-6">
          <h2 className="text-lg font-bold text-ink">자주 묻는 질문</h2>
          <dl className="mt-4 space-y-5">
            {item.faq.map((f) => (
              <div key={f.q}>
                <dt className="font-semibold text-ink">Q. {f.q}</dt>
                <dd className="mt-1.5 leading-relaxed text-ink-body">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <p className="mt-8 text-xs text-ink-faint">
        내용 확인일 {item.lastVerified} · 2026년 제도 기준. 지자체·기관 사정에 따라 달라질 수
        있습니다.
      </p>
    </article>
  )
}
