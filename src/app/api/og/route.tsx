/**
 * 동적 OG 이미지 — /api/og?slug=<항목>&d=<출생일(선택)>
 * slug 없이 호출하면 사이트 공용 이미지를 렌더링합니다.
 * d(YYYY-MM-DD)가 있으면 해당 출생일 기준 마감일을 함께 표시합니다.
 */

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getItemBySlug } from '@/data/checklist'
import { SITE_NAME } from '@/data/site'
import { addDays, formatKorean, isValidDateString, parseDate } from '@/lib/date'

export const runtime = 'nodejs'

// design-tokens.css 팔레트 — OG 렌더러(satori)는 CSS 변수를 못 쓰므로 리터럴로 매핑
const C = {
  bg: '#ffffff',
  surface: '#f7f8f9',
  ink: '#14181e',
  muted: '#6b7480',
  line: '#e2e5e9',
  accent: '#0c74ee',
  danger: '#d8483a',
}

const FONT_DIR = join(process.cwd(), 'src/app/api/og')

async function loadFonts() {
  const [bold, regular] = await Promise.all([
    readFile(join(FONT_DIR, 'Pretendard-Bold.woff')),
    readFile(join(FONT_DIR, 'Pretendard-Regular.woff')),
  ])
  return [
    { name: 'Pretendard', data: bold, weight: 700 as const, style: 'normal' as const },
    { name: 'Pretendard', data: regular, weight: 400 as const, style: 'normal' as const },
  ]
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug')
  const d = req.nextUrl.searchParams.get('d')
  const item = slug ? getItemBySlug(slug) : undefined
  const fonts = await loadFonts()

  const title = item ? item.title : '출산 후 해야 할 일, 출생일 하나로 마감까지 계산'
  const chip =
    item && d && isValidDateString(d) && item.offsetDays !== null
      ? `마감 ${formatKorean(addDays(parseDate(d), item.offsetDays))}`
      : (item?.offsetLabel ?? '2026년 제도 기준')

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: C.bg,
          padding: 72,
          fontFamily: 'Pretendard',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: C.accent,
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div
            style={{
              fontSize: item ? 68 : 58,
              fontWeight: 700,
              color: C.ink,
              lineHeight: 1.25,
              letterSpacing: '-0.02em',
              wordBreak: 'keep-all',
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            <div
              style={{
                display: 'flex',
                fontSize: 30,
                fontWeight: 700,
                color: item?.critical ? C.danger : C.accent,
                backgroundColor: C.surface,
                border: `2px solid ${C.line}`,
                borderRadius: 100,
                padding: '12px 28px',
              }}
            >
              {chip}
            </div>
            {item?.critical && (
              <div
                style={{
                  display: 'flex',
                  fontSize: 30,
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: C.danger,
                  borderRadius: 100,
                  padding: '12px 28px',
                }}
              >
                놓치면 손해
              </div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 26, fontWeight: 400, color: C.muted }}>
          출생일 기준 D-day 자동 계산 · 2026년 제도 기준 · 공식 출처 링크
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  )
}
