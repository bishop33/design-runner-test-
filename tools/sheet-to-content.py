#!/usr/bin/env python3
"""시트 CSV 스냅샷을 앱이 읽는 content.json 으로 변환합니다.

원본: tools/content.source.csv  (Google Sheet "임신부터 출산 후 24개월까지 — 전체 콘텐츠" CSV 내보내기)
출력: app/data/content.json

원칙
- 원본에 없는 의료·행정·비용 값을 만들지 않습니다. 비어 있으면 null 로 두고 화면에서 "확인 필요"로 표시합니다.
- 정규화(시기 병합·행동 단계 표기 통일·관련 항목 재계산)는 모두 이 파일에서만 하고 근거를 normalization 에 남깁니다.

실행: python3 tools/sheet-to-content.py
"""
import csv
import json
import os
import re
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "tools", "content.source.csv")
OUT = os.path.join(ROOT, "app", "data", "content.json")

# 여정 단계 순서 (타임라인 세로 순서의 기준)
PHASE_ORDER = [
    "임신 초기", "임신 중기", "임신 후기", "출산 준비", "입원 직전", "입원·출산",
    "병원 회복", "조리원", "집 복귀", "신생아기", "영아 초기", "영아 중기", "영아 후기",
]

# 시트에는 "임신 확인"이 별도 대시기로 1행 있으나,
# 임신 확인 시점은 사람마다 달라 임신 초기 4~9주 안에서 다루기로 함(기획 결정).
PHASE_MERGE = {"임신 확인": "임신 초기"}
BAND_MERGE = {"4~5주": "4~9주", "6~9주": "4~9주"}

# 시트에 '확인'(2행)이 섞여 있어 기획서의 8단계 표기로 통일
ACTION_MERGE = {"확인": "알아보기"}
ACTION_ORDER = ["알아보기", "비교·결정", "준비", "신청·예약", "실행", "기록", "결과 확인", "이용"]

TYPE_ORDER = ["할 일", "검사·진료", "병원 확인 신호", "준비 목록", "육아용품", "증상·변화", "가이드", "경험담"]
IMPORTANCE_ORDER = ["필수", "주의", "권장", "선택"]

# 타임라인 상단 필터(전체·할 일·검사·진료·증상·변화)로 묶는 그룹
TYPE_GROUP = {
    "할 일": "todo", "준비 목록": "todo", "육아용품": "todo",
    "검사·진료": "care", "예방접종": "care",
    "증상·변화": "signal", "병원 확인 신호": "signal",
    "가이드": "guide", "경험담": "story",
}

# 개인화 조건 → 온보딩 답변 키
CONDITION_KEY = {
    "공통": None,
    "조리원 이용": "usesCareCenter",
    "직장인": "hasCompanyLeave",
    "반려동물 있음": "hasPet",
    "어린이집 이용 계획": "plansDaycare",
    "유도분만 예정": "planInduced",
    "제왕절개 예정 또는 가능성 있음": "planCesarean",
    "산후도우미 이용": "usesPostpartumHelper",
}


def slug(no):
    return "c%03d" % int(no)


def norm_source_status(v):
    return v or "확인 필요"


def main():
    with open(SRC, encoding="utf-8") as f:
        rows = list(csv.reader(f))

    header = rows[2]
    raw = [r for r in rows[3:] if any(c.strip() for c in r)]

    notes = []
    items = []
    by_title = {}

    for r in raw:
        r = (r + [""] * 27)[:27]
        (no, phase, band, anchor, start, end, unit, topic, subtopic, tags, ctype,
         action, audience, title, summary, why, how, importance, checkable,
         condition, related, source, source_status, review, cost, voucher, memo) = [c.strip() for c in r]

        if phase in PHASE_MERGE:
            notes.append(f"{no}행: 대시기 '{phase}' → '{PHASE_MERGE[phase]}' 로 병합")
            phase = PHASE_MERGE[phase]
        if band in BAND_MERGE:
            band = BAND_MERGE[band]
        if action in ACTION_MERGE:
            notes.append(f"{no}행: 행동 단계 '{action}' → '{ACTION_MERGE[action]}' 로 통일")
            action = ACTION_MERGE[action]

        item = {
            "id": slug(no),
            "no": int(no),
            "phase": phase,
            "band": band,
            "anchor": anchor,          # 임신 주차 | 입원일 | 출생일 | 조리원 입소일 | 집 복귀일
            "start": int(start),
            "end": int(end),
            "unit": unit,              # 주 | 일 | 개월
            "topic": topic,
            "subtopic": subtopic,
            "tags": [t.strip() for t in tags.split(",") if t.strip()],
            "type": ctype,
            "typeGroup": TYPE_GROUP.get(ctype, "guide"),
            "action": action,
            "audience": audience,
            "title": title,
            "summary": summary,
            "why": why,
            "how": how,
            "importance": importance,
            "checkable": checkable == "예",
            "condition": condition,
            "conditionKey": CONDITION_KEY.get(condition, None),
            # 시트의 '공식 출처'는 234행이 비어 있음 → null 로 두고 화면에서 출처 상태만 노출
            "source": source or None,
            "sourceStatus": norm_source_status(source_status),
            "reviewStatus": review or "초안",
            # 예상 비용·바우처는 대부분 미기재. 값을 만들지 않고 null 로 둔다.
            "cost": cost or None,
            "voucher": voucher or None,
            "memo": memo or None,
            "related": [],
        }
        items.append(item)
        by_title.setdefault(title, item["id"])

    # ── 관련 항목 재계산
    # 시트의 '관련 항목' 열은 전 행이 자기 제목과 동일해 쓸 수 없다.
    # 같은 세부 주제 → 같은 주제·같은 여정 단계 순으로 최대 4개를 채운다.
    notes.append("'관련 항목' 열은 전 행이 자기 제목과 같아(자기 참조) 사용하지 않고, 세부 주제·주제 기준으로 재계산")
    by_sub = defaultdict(list)
    by_topic_phase = defaultdict(list)
    for it in items:
        by_sub[it["subtopic"]].append(it["id"])
        by_topic_phase[(it["topic"], it["phase"])].append(it["id"])
    for it in items:
        rel = [i for i in by_sub[it["subtopic"]] if i != it["id"]][:4]
        if len(rel) < 2:
            extra = [i for i in by_topic_phase[(it["topic"], it["phase"])] if i != it["id"] and i not in rel]
            rel += extra[: 4 - len(rel)]
        it["related"] = rel

    # ── 행동 흐름(알아보기 → 비교·결정 → 신청·예약 → 이용)
    # 하나의 일도 알아보는 시점과 실행 시점이 달라 시트에서는 여러 행으로 나뉜다.
    # 같은 세부 주제로 묶이는 것도 있고(예: 어린이집), 세부 주제가 달라지는 것도 있어
    # (예: 산모·신생아 건강관리 → 산후도우미) 아래 묶음을 함께 사용한다.
    CHAIN_GROUPS = {
        "조리원": ["산후조리원", "조리원", "조리원 가방", "퇴소 준비", "조리원 선택", "조리원 생활"],
        "산후도우미": ["산모·신생아 건강관리", "산후도우미"],
        "어린이집": ["어린이집", "어린이집 적응"],
        "출산가방": ["출산가방", "입원 당일", "가방 준비"],
        "출산 방법 선택": ["출산 방법", "유도분만", "제왕절개"],
        "회사 휴가": ["회사 제도", "회사 휴가"],
        "예방접종·영유아 건강검진": ["월령별 일정", "출생 후 일정", "돌 이후 일정"],
        "출생 신고와 지원 신청": ["병원 서류", "출생 후 신청", "출생 후 행정"],
        "육아용품 구매와 점검": ["구매 계획", "육아용품 예산", "초기 사용 점검", "구매 경험"],
        "이유식": ["이유식 준비", "이유식·수유", "이유식·식사"],
        "산전 진료비": ["산전 진료비", "임신 중 지원"],
    }
    item_by_id = {it["id"]: it for it in items}
    group_members = defaultdict(list)
    grouped_subs = set()
    for name, subs in CHAIN_GROUPS.items():
        for sub in subs:
            grouped_subs.add(sub)
            group_members[name] += by_sub.get(sub, [])
    # 묶음에 들어가지 않은 세부 주제는 그 자체로 흐름 후보
    for sub, ids in by_sub.items():
        if sub not in grouped_subs:
            group_members[sub] += ids

    def chain_key(i):
        it = item_by_id[i]
        return (PHASE_ORDER.index(it["phase"]), ACTION_ORDER.index(it["action"]), it["no"])

    chains = []
    for name, ids in group_members.items():
        if len({item_by_id[i]["action"] for i in ids}) < 2:
            continue
        chains.append({"id": "h%02d" % len(chains), "name": name, "items": sorted(set(ids), key=chain_key)})
    chain_of = {}
    for ch in chains:
        for i in ch["items"]:
            chain_of[i] = ch["id"]
    for it in items:
        it["chain"] = chain_of.get(it["id"], None)

    # ── 구간(밴드) 목록 — 타임라인 섹션의 단위
    bands = []
    seen = set()
    for it in sorted(items, key=lambda x: (PHASE_ORDER.index(x["phase"]), x["no"])):
        key = (it["phase"], it["band"])
        if key in seen:
            continue
        seen.add(key)
        bands.append({
            "id": "b%02d" % len(bands),
            "phase": it["phase"],
            "band": it["band"],
            "anchor": it["anchor"],
            "start": it["start"],
            "end": it["end"],
            "unit": it["unit"],
        })
    band_id = {(b["phase"], b["band"]): b["id"] for b in bands}
    for it in items:
        it["bandId"] = band_id[(it["phase"], it["band"])]

    meta = {
        "title": "임신부터 출산 후 24개월까지 — 전체 콘텐츠",
        "sourceSheet": "https://docs.google.com/spreadsheets/d/1kC-AZzhLd43BWOjHFNejDOtN7USQxusJK0Obw8jr0uo/htmlview",
        "sheetColumns": header,
        "itemCount": len(items),
        "phaseOrder": PHASE_ORDER,
        "actionOrder": ACTION_ORDER,
        "typeOrder": TYPE_ORDER,
        "importanceOrder": IMPORTANCE_ORDER,
        "topics": [t for t, _ in Counter(i["topic"] for i in items).most_common()],
        "conditions": sorted({i["condition"] for i in items}),
        "normalization": notes,
        "chains": chains,
        "gaps": {
            "공식 출처 미기재": sum(1 for i in items if not i["source"]),
            "예상 비용 미기재": sum(1 for i in items if not i["cost"]),
            "바우처 값 미기재": sum(1 for i in items if not i["voucher"]),
            "검토 상태 초안": sum(1 for i in items if i["reviewStatus"] == "초안"),
        },
    }

    with open(OUT, "w", encoding="utf-8") as f:
        json.dump({"meta": meta, "bands": bands, "items": items}, f, ensure_ascii=False, indent=1)

    print(f"{len(items)}개 항목 · {len(bands)}개 구간 · {len(chains)}개 행동 흐름 → {OUT}")
    for n in notes[:5]:
        print("  ·", n)


if __name__ == "__main__":
    main()
