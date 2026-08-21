/** 사이트 전역 상수 — 배포 도메인이 정해지면 여기만 바꿉니다. */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://baby-checklist.vercel.app'

export const SITE_NAME = '출산 후 행정 체크리스트'

export const SITE_DESCRIPTION =
  '출생일만 입력하면 출생신고·부모급여·산후도우미 등 놓치면 손해 보는 행정 절차의 마감일을 D-day로 자동 계산해 주는 체크리스트. 2026년 제도 기준, 공식 출처 링크 포함.'

export const DISCLAIMER =
  '본 정보는 참고용이며 지자체별로 상이할 수 있습니다. 최종 확인은 반드시 관할 주민센터·보건소 또는 공식 사이트에서 하세요.'
