/**
 * .ics(iCalendar) 생성 — 마감일을 종일 일정으로 내보냅니다.
 * 외부 의존성 없이 RFC 5545의 최소 집합만 사용합니다.
 */

import type { ChecklistItem } from '@/data/checklist'
import { addDays, computeDday, formatDate } from '@/lib/date'
import { SITE_URL } from '@/data/site'

function toIcsDate(date: Date): string {
  return formatDate(date).replaceAll('-', '')
}

function escapeText(text: string): string {
  return text
    .replaceAll('\\', '\\\\')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,')
    .replaceAll('\n', '\\n')
}

/** 75바이트 폴딩은 생략(주요 캘린더 앱 모두 수용) — 줄바꿈만 CRLF로 통일 */
function buildEvent(item: ChecklistItem, birth: Date): string[] {
  const dday = computeDday(item, birth)
  if (!dday.deadline) return []
  const dtstart = toIcsDate(dday.deadline)
  const dtend = toIcsDate(addDays(dday.deadline, 1)) // 종일 일정은 DTEND가 다음 날
  const uid = `${item.id}-${formatDate(birth)}@baby-checklist`
  const description = `${item.shortDesc}\n처리: ${item.where}\n상세: ${SITE_URL}/checklist/${item.slug}`
  return [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstart}T000000Z`,
    `DTSTART;VALUE=DATE:${dtstart}`,
    `DTEND;VALUE=DATE:${dtend}`,
    `SUMMARY:${escapeText(`[아기] ${item.title} 마감`)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'TRIGGER:-P3D',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(`${item.title} 마감 3일 전`)}`,
    'END:VALARM',
    'END:VEVENT',
  ]
}

export function buildIcs(items: ChecklistItem[], birth: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//baby-checklist//postpartum-checklist//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...items.flatMap((item) => buildEvent(item, birth)),
    'END:VCALENDAR',
  ]
  return lines.join('\r\n')
}

export function downloadIcs(items: ChecklistItem[], birth: Date, filename: string) {
  const blob = new Blob([buildIcs(items, birth)], {
    type: 'text/calendar;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
