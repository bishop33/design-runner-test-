'use client'

/**
 * 상세 페이지 상단의 개인화 배너.
 * 정적(SSG) 페이지 위에서 URL 쿼리·localStorage의 출생일을 읽어
 * 이 항목의 마감 D-day를 보여주고 .ics 저장 버튼을 제공합니다.
 */

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CalendarPlus } from 'lucide-react'
import type { ChecklistItem } from '@/data/checklist'
import { computeDday, formatKoreanWithWeekday, isValidDateString, parseDate } from '@/lib/date'
import { downloadIcs } from '@/lib/ics'

const BIRTH_KEY = 'checklist:birth'

export function ItemDdayNotice({ item }: { item: ChecklistItem }) {
  const [birthStr, setBirthStr] = useState<string | null>(null)

  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get('d')
      if (q && isValidDateString(q)) {
        setBirthStr(q)
        localStorage.setItem(BIRTH_KEY, q)
        return
      }
      const saved = localStorage.getItem(BIRTH_KEY)
      if (saved && isValidDateString(saved)) setBirthStr(saved)
    } catch {}
  }, [])

  if (!birthStr) {
    return (
      <div className="rounded-sm border border-line bg-surface p-4 text-sm text-ink-body">
        <Link href="/" className="font-semibold text-accent underline underline-offset-2">
          체크리스트에서 출생일을 입력
        </Link>
        하면 이 항목의 마감일이 D-day로 계산됩니다.
      </div>
    )
  }

  const birth = parseDate(birthStr)
  const dday = computeDday(item, birth)

  if (!dday.deadline) {
    return (
      <div className="rounded-sm border border-line bg-surface p-4 text-sm text-ink-body">
        이 항목은 법정 기한이 없습니다.{' '}
        {item.offsetLabel && <span className="font-semibold text-ink">{item.offsetLabel}</span>}
      </div>
    )
  }

  const overdue = dday.status === 'overdue'
  const urgent = dday.status === 'urgent'

  return (
    <div
      className={`rounded-sm border p-4 text-sm ${
        overdue || urgent ? 'border-danger bg-danger-surface' : 'border-line bg-surface'
      }`}
    >
      <p className={overdue || urgent ? 'text-ink' : 'text-ink-body'}>
        출생일 {birthStr} 기준 마감{' '}
        <strong className="font-bold text-ink">{formatKoreanWithWeekday(dday.deadline)}</strong>
        {' · '}
        <strong className={`font-bold ${overdue || urgent ? 'text-danger' : 'text-accent'}`}>
          {dday.label}
          {overdue && ' 지남'}
        </strong>
        {overdue && ' — 지금이라도 관할 기관에 처리 가능 여부를 확인하세요.'}
      </p>
      <button
        type="button"
        onClick={() => downloadIcs([item], birth, `${item.slug}-${birthStr}.ics`)}
        className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-accent underline-offset-2 hover:underline"
      >
        <CalendarPlus className="size-4" aria-hidden />
        이 마감을 캘린더에 추가 (.ics)
      </button>
    </div>
  )
}
