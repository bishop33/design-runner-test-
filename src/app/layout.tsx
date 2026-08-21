import type { Metadata, Viewport } from 'next'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/data/site'
import { SiteHeader } from '@/components/SiteHeader'
import { SiteFooter } from '@/components/SiteFooter'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 출생일로 마감 자동 계산`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'ko_KR',
  },
  robots: { index: true, follow: true },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101318' },
  ],
}

/** 페인트 전에 다크모드·출생일 보유 여부를 클래스로 반영해
    다크모드 깜빡임과 하이드레이션 레이아웃 시프트를 막는 초기화 스크립트 */
const themeInit = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches);if(d)document.documentElement.classList.add('dark');var q=new URLSearchParams(location.search).get('d');var b=(q&&/^\\d{4}-\\d{2}-\\d{2}$/.test(q))||/^\\d{4}-\\d{2}-\\d{2}$/.test(localStorage.getItem('checklist:birth')||'');if(b)document.documentElement.classList.add('has-birth')}catch(e){}})()`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
        {/* Pretendard Variable — 동적 서브셋 셀프호스팅 (public/fonts).
            첫 페인트를 막지 않도록 비동기 로드: 첫 방문은 시스템 한글 폰트로
            즉시 그리고(font-display: optional), 캐시된 뒤에는 Pretendard로 렌더 */}
        <link
          rel="preload"
          as="style"
          href="/fonts/pretendard/pretendardvariable-dynamic-subset.css"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var l=document.createElement('link');l.rel='stylesheet';l.href='/fonts/pretendard/pretendardvariable-dynamic-subset.css';document.head.appendChild(l)})()`,
          }}
        />
        <noscript>
          <link
            rel="stylesheet"
            href="/fonts/pretendard/pretendardvariable-dynamic-subset.css"
          />
        </noscript>
      </head>
      <body className="min-h-dvh bg-bg text-ink">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl px-4 pb-16">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
