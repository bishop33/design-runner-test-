'use client'

/**
 * 메인 체크리스트 인터랙션.
 * - 출생일: URL 쿼리 ?d=YYYY-MM-DD 가 단일 소스, localStorage 는 백업.
 * - 최초 렌더(서버·정적)는 출생일 없음 상태의 전체 목록을 그대로 그리므로
 *   검색엔진에는 완전한 정적 콘텐츠가 노출됩니다.
 */

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  CalendarPlus,
  Check,
  ChevronRight,
  Download,
  Eye,
  EyeOff,
  MapPin,
  RotateCcw,
} from 'lucide-react'
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  CHECKLIST_ITEMS,
  type ChecklistItem,
} from '@/data/checklist'
import {
  computeDday,
  diffDays,
  formatKoreanWithWeekday,
  isValidDateString,
  parseDate,
  today,
  type Dday,
} from '@/lib/date'
import { downloadIcs } from '@/lib/ics'

const BIRTH_KEY = 'checklist:birth'
const doneKey = (birth: string) => `checklist:done:${birth}`

function readDone(birth: string): Set<string> {
  try {
    const raw = localStorage.getItem(doneKey(birth))
    if (raw) return new Set(JSON.parse(raw) as string[])
  } catch {}
  return new Set()
}

/** D-day 배지 — 상태별 색은 여기 한 곳에서만 결정 */
function DdayBadge({ dday, done }: { dday: Dday; done: boolean }) {
  if (dday.label === null) return null
  if (done) {
    return (
      <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-muted">
        {dday.label}
      </span>
    )
  }
  if (dday.status === 'overdue') {
    return (
      <span className="rounded-pill bg-danger px-2 py-0.5 text-xs font-bold text-danger-fg">
        {dday.label} 지남
      </span>
    )
  }
  if (dday.status === 'urgent') {
    return (
      <span className="rounded-pill bg-danger-surface px-2 py-0.5 text-xs font-bold text-danger">
        {dday.label}
      </span>
    )
  }
  if (dday.status === 'soon') {
    return (
      <span className="rounded-pill bg-accent-surface px-2 py-0.5 text-xs font-semibold text-accent">
        {dday.label}
      </span>
    )
  }
  return (
    <span className="rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-semibold text-ink-muted">
      {dday.label}
    </span>
  )
}

function ItemCard({
  item,
  birth,
  done,
  onToggle,
  onAddToCalendar,
}: {
  item: ChecklistItem
  birth: Date | null
  done: boolean
  onToggle: () => void
  onAddToCalendar: () => void
}) {
  const dday = birth ? computeDday(item, birth) : null
  const urgent = !done && dday !== null && (dday.status === 'overdue' || dday.status === 'urgent')

  return (
    <li
      className={`rounded-sm border bg-bg p-4 ${
        urgent && item.critical ? 'border-danger' : urgent ? 'border-line-strong' : 'border-line'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`${item.title} 완료 표시`}
          onClick={onToggle}
          className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-sm border ${
            done
              ? 'border-ok bg-ok-surface text-ok'
              : 'border-line-strong bg-bg text-transparent hover:border-ink-muted'
          }`}
        >
          <Check className="size-4" aria-hidden strokeWidth={3} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {dday && <DdayBadge dday={dday} done={done} />}
            {item.critical && !done && (
              <span className="flex items-center gap-1 rounded-pill bg-danger-surface px-2 py-0.5 text-xs font-semibold text-danger">
                <AlertTriangle className="size-3" aria-hidden />
                놓치면 손해
              </span>
            )}
            {item.varies && (
              <span className="flex items-center gap-1 rounded-pill bg-surface-2 px-2 py-0.5 text-xs font-medium text-ink-muted">
                <MapPin className="size-3" aria-hidden />
                지자체별 상이
              </span>
            )}
          </div>

          <Link href={`/checklist/${item.slug}`} className="group mt-1.5 block">
            <h3
              className={`flex items-center gap-1 font-semibold leading-snug ${
                done ? 'text-ink-faint line-through decoration-1' : 'text-ink'
              }`}
            >
              {item.title}
              <ChevronRight
                className="size-4 shrink-0 text-ink-faint group-hover:text-ink-muted"
                aria-hidden
              />
            </h3>
            <p className={`mt-1 text-sm leading-relaxed ${done ? 'text-ink-faint' : 'text-ink-body'}`}>
              {item.shortDesc}
            </p>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-muted">
            {dday?.deadline ? (
              <span>마감 {formatKoreanWithWeekday(dday.deadline)}</span>
            ) : (
              item.offsetLabel && <span>{item.offsetLabel}</span>
            )}
            <span className="text-ink-faint">확인 {item.lastVerified}</span>
            {dday?.deadline && !done && (
              <button
                type="button"
                onClick={onAddToCalendar}
                className="flex items-center gap-1 rounded-sm text-accent underline-offset-2 hover:underline"
              >
                <CalendarPlus className="size-3.5" aria-hidden />
                캘린더에 추가
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  )
}

export function ChecklistApp() {
  const [birthStr, setBirthStr] = useState<string | null>(null)
  const [done, setDone] = useState<Set<string>>(new Set())
  const [hideDone, setHideDone] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 마운트 시: URL 쿼리 → localStorage 순서로 출생일 복원
  useEffect(() => {
    let d: string | null = null
    try {
      d = new URLSearchParams(window.location.search).get('d')
    } catch {}
    if (d && isValidDateString(d)) {
      applyBirth(d, { updateUrl: false })
    } else {
      try {
        const saved = localStorage.getItem(BIRTH_KEY)
        if (saved && isValidDateString(saved)) applyBirth(saved, { updateUrl: true })
      } catch {}
    }
    setMounted(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function applyBirth(value: string, opts: { updateUrl: boolean }) {
    setBirthStr(value)
    setDone(readDone(value))
    try {
      localStorage.setItem(BIRTH_KEY, value)
    } catch {}
    if (opts.updateUrl) {
      const url = new URL(window.location.href)
      url.searchParams.set('d', value)
      window.history.replaceState(null, '', url)
    }
  }

  function clearBirth() {
    setBirthStr(null)
    setDone(new Set())
    try {
      localStorage.removeItem(BIRTH_KEY)
    } catch {}
    const url = new URL(window.location.href)
    url.searchParams.delete('d')
    window.history.replaceState(null, '', url)
  }

  function toggleDone(id: string) {
    if (!birthStr) return
    setDone((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try {
        localStorage.setItem(doneKey(birthStr), JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  function resetDone() {
    if (!birthStr) return
    if (!window.confirm('체크한 항목을 모두 초기화할까요?')) return
    setDone(new Set())
    try {
      localStorage.removeItem(doneKey(birthStr))
    } catch {}
  }

  const birth = birthStr ? parseDate(birthStr) : null
  const ageDays = birth && mounted ? diffDays(birth, today()) : null

  // "지금 해야 할 일": 지남·D-7 이내 + 생후 30일 내라면 '즉시' 카테고리의 기한 없는 항목
  const nowItems = useMemo(() => {
    if (!birth || !mounted) return []
    return CHECKLIST_ITEMS.filter((item) => {
      if (done.has(item.id)) return false
      const dday = computeDday(item, birth)
      if (dday.status === 'overdue' || dday.status === 'urgent') return true
      if (
        item.category === 'immediate' &&
        dday.status === 'none' &&
        ageDays !== null &&
        ageDays <= 30
      )
        return true
      return false
    }).sort((a, b) => {
      const ra = computeDday(a, birth).remaining ?? 999
      const rb = computeDday(b, birth).remaining ?? 999
      return ra - rb
    })
  }, [birth, done, mounted, ageDays])

  const doneCount = done.size
  const total = CHECKLIST_ITEMS.length
  const progress = Math.round((doneCount / total) * 100)

  function exportAllIcs() {
    if (!birth || !birthStr) return
    const pending = CHECKLIST_ITEMS.filter((i) => !done.has(i.id) && i.offsetDays !== null)
    downloadIcs(pending, birth, `아기-체크리스트-${birthStr}.ics`)
  }

  function exportOneIcs(item: ChecklistItem) {
    if (!birth || !birthStr) return
    downloadIcs([item], birth, `${item.slug}-${birthStr}.ics`)
  }

  return (
    <div className="space-y-8">
      {/* 출생일 입력 */}
      <section className="rounded-lg border border-line bg-surface p-4 sm:p-6">
        <label htmlFor="birth-date" className="block text-sm font-semibold text-ink">
          아기 출생일
        </label>
        <p className="mt-1 text-sm text-ink-muted">
          입력하면 모든 마감일이 D-day로 계산됩니다. 날짜는 이 기기에만 저장됩니다.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            id="birth-date"
            type="date"
            value={birthStr ?? ''}
            onChange={(e) => {
              const v = e.target.value
              if (v && isValidDateString(v)) applyBirth(v, { updateUrl: true })
              else if (!v) clearBirth()
            }}
            className="h-11 rounded-sm border border-line-strong bg-bg px-3 text-base text-ink"
          />
          {birth && ageDays !== null && (
            <span className="rounded-pill bg-accent-surface px-3 py-1.5 text-sm font-semibold text-accent">
              생후 {ageDays}일
            </span>
          )}
        </div>
      </section>

      {/* 지금 해야 할 일 */}
      {birth && mounted && (
        <section aria-labelledby="now-heading" className="rise-once">
          <h2 id="now-heading" className="flex items-center gap-2 text-lg font-bold text-ink">
            <AlertTriangle className="size-5 text-danger" aria-hidden />
            지금 해야 할 일
          </h2>
          {nowItems.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {nowItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  birth={birth}
                  done={done.has(item.id)}
                  onToggle={() => toggleDone(item.id)}
                  onAddToCalendar={() => exportOneIcs(item)}
                />
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-sm border border-line bg-surface p-4 text-sm text-ink-body">
              임박하거나 지난 항목이 없습니다. 아래 전체 목록에서 다가올 마감을 미리 확인하세요.
            </p>
          )}
        </section>
      )}

      {/* 진행률·도구 */}
      {birth && mounted && (
        <section className="rounded-lg border border-line bg-surface p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">
              {doneCount}/{total} 완료
            </span>
            <span className="text-ink-muted">{progress}%</span>
          </div>
          <div
            className="mt-2 h-2 overflow-hidden rounded-pill bg-surface-2"
            role="progressbar"
            aria-label="완료 진행률"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-pill bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportAllIcs}
              className="flex h-10 items-center gap-1.5 rounded-sm bg-accent px-3 text-sm font-semibold text-accent-fg"
            >
              <Download className="size-4" aria-hidden />
              미완료 마감 .ics 저장
            </button>
            <button
              type="button"
              onClick={() => setHideDone((v) => !v)}
              aria-pressed={hideDone}
              className="flex h-10 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-sm font-medium text-ink-body hover:bg-surface-2"
            >
              {hideDone ? (
                <Eye className="size-4" aria-hidden />
              ) : (
                <EyeOff className="size-4" aria-hidden />
              )}
              {hideDone ? '완료 항목 보기' : '완료 항목 숨기기'}
            </button>
            <button
              type="button"
              onClick={resetDone}
              className="flex h-10 items-center gap-1.5 rounded-sm border border-line-strong px-3 text-sm font-medium text-ink-body hover:bg-surface-2"
            >
              <RotateCcw className="size-4" aria-hidden />
              초기화
            </button>
          </div>
        </section>
      )}

      {/* 전체 목록 — 출생일이 없어도 항상 렌더 (검색엔진용 정적 콘텐츠).
          출생일 보유 방문은 마운트 전까지 감춰 레이아웃 시프트를 막음 (globals.css) */}
      <div className={mounted ? 'space-y-8' : 'space-y-8 hide-until-mounted'}>
      {CATEGORY_ORDER.map((category) => {
        const items = CHECKLIST_ITEMS.filter((i) => i.category === category).filter(
          (i) => !(hideDone && done.has(i.id)),
        )
        if (items.length === 0) return null
        return (
          <section key={category} aria-labelledby={`cat-${category}`}>
            <h2 id={`cat-${category}`} className="text-lg font-bold text-ink">
              {CATEGORY_LABELS[category]}
            </h2>
            <ul className="mt-3 space-y-3">
              {items.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  birth={mounted ? birth : null}
                  done={done.has(item.id)}
                  onToggle={() => toggleDone(item.id)}
                  onAddToCalendar={() => exportOneIcs(item)}
                />
              ))}
            </ul>
          </section>
        )
      })}
      </div>
    </div>
  )
}
