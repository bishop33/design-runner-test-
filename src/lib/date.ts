/**
 * 날짜·D-day 계산 유틸리티.
 * 출생일은 항상 'YYYY-MM-DD' 문자열로 다루고, 계산은 로컬 타임존의
 * 자정 기준으로 해서 시간대에 따른 하루 오차를 없앱니다.
 */

import type { ChecklistItem } from '@/data/checklist'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function isValidDateString(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const d = parseDate(value)
  return !Number.isNaN(d.getTime()) && formatDate(d) === value
}

/** 'YYYY-MM-DD' → 로컬 자정 Date */
export function parseDate(value: string): Date {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Date → 'YYYY-MM-DD' */
export function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** 오늘(로컬 자정) */
export function today(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

/** 두 날짜(자정 기준) 사이의 일수. b가 미래면 양수 */
export function diffDays(a: Date, b: Date): number {
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY)
}

export type DdayStatus =
  | 'none' // 기한 없음
  | 'overdue' // 마감 지남
  | 'urgent' // D-7 이내
  | 'soon' // D-30 이내
  | 'later' // 여유

export type Dday = {
  status: DdayStatus
  /** 마감일. 기한 없는 항목은 null */
  deadline: Date | null
  /** 남은 일수 (마감 당일 0, 지났으면 음수). 기한 없는 항목은 null */
  remaining: number | null
  /** 'D-3' | 'D-DAY' | 'D+2' | null */
  label: string | null
}

export function computeDday(item: ChecklistItem, birth: Date, base: Date = today()): Dday {
  if (item.offsetDays === null) {
    return { status: 'none', deadline: null, remaining: null, label: null }
  }
  const deadline = addDays(birth, item.offsetDays)
  const remaining = diffDays(base, deadline)
  const label = remaining === 0 ? 'D-DAY' : remaining > 0 ? `D-${remaining}` : `D+${-remaining}`
  const status: DdayStatus =
    remaining < 0 ? 'overdue' : remaining <= 7 ? 'urgent' : remaining <= 30 ? 'soon' : 'later'
  return { status, deadline, remaining, label }
}

/** '2026-08-15' → '2026년 8월 15일' */
export function formatKorean(date: Date): string {
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

export function formatKoreanWithWeekday(date: Date): string {
  return `${formatKorean(date)} (${WEEKDAYS[date.getDay()]})`
}
