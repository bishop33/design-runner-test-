import type { Metadata } from 'next'
import { ChecklistApp } from '@/components/ChecklistApp'
import { CHECKLIST_ITEMS } from '@/data/checklist'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/data/site'

export const metadata: Metadata = {
  title: `${SITE_NAME} — 출생일로 마감 자동 계산`,
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    images: [{ url: '/api/og', width: 1200, height: 630 }],
  },
}

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        inLanguage: 'ko',
      },
      {
        '@type': 'ItemList',
        name: '출산 후 행정 절차 체크리스트 (2026년 기준)',
        numberOfItems: CHECKLIST_ITEMS.length,
        itemListElement: CHECKLIST_ITEMS.map((item, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: item.title,
          url: `${SITE_URL}/checklist/${item.slug}`,
        })),
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="py-8">
        <h1 className="text-2xl font-bold leading-snug text-ink sm:text-3xl">
          출산 후 해야 할 일,
          <br />
          출생일 하나로 마감까지 계산
        </h1>
        <p className="mt-3 leading-relaxed text-ink-body">
          출생신고 30일, 부모급여 60일, 산후도우미 신청 30일 — 기한을 넘기면 과태료를 내거나
          지원금을 통째로 놓칩니다. 아기 출생일을 입력하면 {CHECKLIST_ITEMS.length}개 행정
          절차의 마감일을 자동 계산해 지금 해야 할 일부터 보여줍니다. 2026년 제도 기준이며,
          모든 항목에 공식 출처 링크가 있습니다.
        </p>
      </div>
      <ChecklistApp />
    </>
  )
}
