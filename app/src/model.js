// 콘텐츠 원본 + 사용자 상태를 합쳐 화면이 쓰는 목록을 만듭니다.
// 원본(content.json)은 읽기 전용입니다.

import { buildAnchors, itemWindow, today, diffDays, relDays, fmtShort } from './dates.js';
import * as store from './store.js';

let content = null;

export async function loadContent() {
  if (content) return content;
  const res = await fetch(new URL('../data/content.json', import.meta.url));
  if (!res.ok) throw new Error(`콘텐츠를 불러오지 못했습니다 (${res.status})`);
  content = await res.json();
  content.byId = Object.fromEntries(content.items.map((i) => [i.id, i]));
  content.bandById = Object.fromEntries(content.bands.map((b) => [b.id, b]));
  content.chainById = Object.fromEntries((content.meta.chains || []).map((c) => [c.id, c]));
  return content;
}

export const getContent = () => content;

/* ── 개인화 ───────────────────────────────────────────── */

/**
 * 온보딩 답변 → 개인화 조건별 판정.
 *  true  = 해당됨(우선순위 올림)
 *  false = 해당 없음(기본 숨김, 설정에서 볼 수 있음)
 *  null  = 아직 모름(그대로 보여주되 올리지 않음)
 */
export function conditionVerdict(key, p) {
  switch (key) {
    case 'usesCareCenter': return p.usesCareCenter;
    case 'hasCompanyLeave': return p.hasCompanyLeave;
    case 'hasPet': return p.hasPet;
    case 'plansDaycare': return p.plansDaycare;
    case 'usesPostpartumHelper': return p.usesPostpartumHelper;
    case 'planInduced':
      if (p.deliveryPlan === '유도분만') return true;
      if (p.deliveryPlan === '아직 모름') return null;
      return false;
    case 'planCesarean':
      if (p.deliveryPlan === '제왕절개') return true;
      // 자연분만·유도분만을 계획해도 상황에 따라 제왕절개가 될 수 있어 숨기지 않습니다.
      return null;
    default: return true;
  }
}

const IMPORTANCE_W = { 필수: 30, 주의: 26, 권장: 12, 선택: 4 };
const STATUS_W = { '확인 전': 8, 확인했어요: 6, '준비 중': 10, 완료: -999, '해당 없음': -999 };

/**
 * 항목 하나를 화면용으로 부풀립니다.
 * 원본 필드 + 사용자 상태 + 계산된 날짜/우선순위.
 */
function decorate(item, ctx) {
  const e = store.entry(item.id);
  let win = itemWindow(item, ctx.anchors);
  // 아기가 태어나면 임신 주차 기준 항목은 그 시점에서 끝난 것으로 봅니다.
  // (37~40주 구간이 출생 후에도 '지금'으로 남아 첫 화면을 차지하는 것을 막습니다.)
  if (win && ctx.anchors.hasBirth && item.anchor === '임신 주차' && win.to > ctx.anchors.birth) {
    win = { from: win.from, to: ctx.anchors.birth };
  }
  const verdict = item.conditionKey ? conditionVerdict(item.conditionKey, ctx.profile) : true;

  let dLeft = null;      // 시작까지 남은 일수 (음수면 이미 시작)
  let dOver = null;      // 종료 이후 지난 일수
  let when = 'unknown';
  if (win) {
    dLeft = diffDays(win.from, ctx.now);
    dOver = diffDays(ctx.now, win.to);
    if (ctx.now < win.from) when = 'future';
    else if (ctx.now > win.to) when = 'past';
    else when = 'now';
  }

  const done = e.status === '완료' || e.status === '해당 없음';
  let score = IMPORTANCE_W[item.importance] ?? 10;
  score += STATUS_W[e.status] ?? 8;
  if (item.checkable) score += 4;
  if (item.typeGroup === 'story') score -= 12;
  if (item.typeGroup === 'guide') score -= 4;
  if (verdict === true) score += 15;
  if (verdict === null) score -= 4;
  // 지난 항목은 마감 직후가 가장 급하고, 오래될수록 잔소리가 됩니다. 2주쯤 지나면 사그라듭니다.
  if (when === 'past') score += Math.max(0, 70 - dOver * 2);
  else if (when === 'now') score += 60;
  else if (when === 'future') score += Math.max(0, 40 - dLeft);
  // 첫째가 아니면 일반 가이드·증상 설명의 우선순위를 낮춥니다(숨기지 않음).
  if (ctx.profile.firstBaby === false && (item.typeGroup === 'guide' || item.typeGroup === 'signal')) score -= 6;
  // 자가용이 없으면 이동·퇴원 준비를 올립니다.
  if (ctx.profile.hasCar === false && /이동|퇴원/.test(item.subtopic)) score += 8;
  // 부모님 도움이 없으면 돌봄 서비스 항목을 올립니다.
  if (ctx.profile.parentsHelp === false && item.topic === '병원·조리원·돌봄 서비스') score += 6;

  return {
    ...item,
    entry: e,
    status: e.status,
    done,
    window: win,
    when,
    dLeft,
    dOver,
    verdict,
    hidden: verdict === false && ctx.profile.hideNonApplicable,
    score: done ? -1000 : score,
    // 한참 지난 항목에 "224일 지남"은 정보가 아니라 소음이므로 날짜로 바꿉니다.
    whenLabel: win
      ? when === 'past'
        ? (done || dOver > 30 ? fmtShort(win.to) : `${dOver}일 지남`)
        : when === 'now'
          ? `~${fmtShort(win.to)}`
          : relDays(dLeft)
      : '날짜 미정',
  };
}

/** 사용자 추가 항목을 원본 항목과 같은 모양으로 맞춥니다. */
function fromCustom(c) {
  return {
    id: c.id,
    no: 0,
    phase: c.phase,
    band: c.band || c.phase,
    bandId: c.bandId || null,
    anchor: c.anchor || '임신 주차',
    start: c.start ?? 0,
    end: c.end ?? 0,
    unit: c.unit || '주',
    topic: c.topic,
    subtopic: '직접 추가',
    tags: [],
    type: c.type || '할 일',
    typeGroup: 'todo',
    action: c.action || '실행',
    audience: '부부',
    title: c.title,
    summary: c.summary || '',
    why: '',
    how: '',
    importance: c.importance || '권장',
    checkable: true,
    condition: '공통',
    conditionKey: null,
    source: null,
    sourceStatus: '사용자 추가',
    reviewStatus: '사용자 추가',
    cost: c.cost || null,
    voucher: null,
    memo: null,
    related: [],
    chain: null,
    custom: true,
  };
}

/** 화면이 쓰는 전체 목록 한 벌. 상태가 바뀔 때마다 다시 만듭니다. */
export function buildView() {
  const s = store.get();
  const ctx = { profile: s.profile, anchors: buildAnchors(s.profile), now: today() };
  const base = content.items.map((i) => decorate(i, ctx));
  const custom = s.customItems.map((c) => decorate(fromCustom(c), ctx));
  const all = [...base, ...custom];
  return {
    ctx,
    anchors: ctx.anchors,
    all,
    byId: Object.fromEntries(all.map((i) => [i.id, i])),
    visible: all.filter((i) => !i.hidden),
    hiddenCount: all.filter((i) => i.hidden).length,
  };
}

/* ── 화면별 묶음 ──────────────────────────────────────── */

/**
 * 지금 먼저 할 일 — 지났거나 지금 구간이거나 7일 안에 시작하는 것 중 상위 n개.
 * 지난 항목만으로 목록이 채워지면 "지금"이 안 보이므로 지난 항목은 최대 2개로 제한합니다.
 */
export function nowList(view, n = 5, maxOverdue = 2) {
  const pool = view.visible
    .filter((i) => !i.done && i.checkable && (i.when === 'past' || i.when === 'now' || (i.when === 'future' && i.dLeft <= 7)))
    .sort((a, b) => b.score - a.score);
  const out = [];
  let overdue = 0;
  for (const i of pool) {
    if (out.length >= n) break;
    if (i.when === 'past') {
      if (overdue >= maxOverdue) continue;
      overdue += 1;
    }
    out.push(i);
  }
  return out;
}

/**
 * 곧 해야 할 일 — 45일 안에 시작하는 것 중 '지금 먼저 할 일'에 이미 오른 것을 뺀 나머지.
 * exclude 를 받지 않으면 7일 뒤부터 봅니다.
 */
export function soonList(view, n = 6, exclude = null) {
  const skip = exclude ? new Set(exclude.map((i) => i.id)) : null;
  return view.visible
    .filter((i) => !i.done && i.when === 'future' && i.dLeft <= 45 && (skip ? !skip.has(i.id) : i.dLeft > 7))
    .sort((a, b) => a.dLeft - b.dLeft || b.score - a.score)
    .slice(0, n);
}

export function recentlyDone(view, n = 5) {
  return view.all
    .filter((i) => i.status === '완료' && i.entry.doneAt)
    .sort((a, b) => (a.entry.doneAt < b.entry.doneAt ? 1 : -1))
    .slice(0, n);
}

/** 아직 확인하지 않은 중요 항목(필수·주의). 홈에서 놓친 것을 잡아 줍니다. */
export function unchecked(view, n = 5) {
  return view.visible
    .filter((i) => i.status === '확인 전' && (i.importance === '필수' || i.importance === '주의'))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

/** 현재 구간(밴드) id. 없으면 가장 가까운 다음 구간. */
export function currentBandId(view) {
  const bands = content.bands.map((b) => {
    const w = itemWindow(b, view.anchors);
    return { id: b.id, w };
  });
  const now = today();
  const inNow = bands.find((b) => b.w && now >= b.w.from && now <= b.w.to);
  if (inNow) return inNow.id;
  const next = bands.filter((b) => b.w && b.w.from > now).sort((a, b) => a.w.from - b.w.from)[0];
  return next?.id || bands[bands.length - 1]?.id || null;
}

export function bandWindow(band, anchors) {
  return itemWindow(band, anchors);
}

/** 검색 — 제목·주제·세부 주제·요약을 대상으로 단순 포함 검색. */
export function search(view, q) {
  const term = q.trim().toLowerCase();
  if (!term) return [];
  return view.all
    .filter((i) =>
      [i.title, i.topic, i.subtopic, i.summary, i.type, i.action, i.phase, i.band]
        .join(' ')
        .toLowerCase()
        .includes(term),
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, 60);
}
