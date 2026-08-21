import type { Metadata } from 'next'
import { SITE_URL } from '@/data/site'
import { B, GuideFaq, GuideTitle, H2, ItemLink, P, UL, guideJsonLd } from '@/components/guide'

const TITLE = '2026 출산 지원금 총정리 — 첫만남이용권·부모급여·아동수당·지자체 지원'
const DESCRIPTION =
  '2026년 기준 출산 가정이 받는 지원금 전체 목록. 첫만남이용권 200~300만원, 부모급여 월 100만원, 아동수당 월 10만원, 지자체 출산지원금·산후조리경비·전기요금 할인까지 금액·기한·신청 방법을 한 번에 정리했습니다.'

export const metadata: Metadata = {
  title: '출산 지원금 총정리 (2026) — 금액·기한·신청 방법',
  description: DESCRIPTION,
  alternates: { canonical: '/guide/subsidy' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/guide/subsidy',
    images: [{ url: '/api/og?slug=first-meeting-voucher', width: 1200, height: 630 }],
  },
}

const FAQ = [
  {
    q: '전부 합치면 얼마를 받나요?',
    a: '가정마다 다르지만 2026년 기준 첫째 출산 시 국가 지원만으로 첫해에 첫만남이용권 200만원 + 부모급여 약 1,200만원(월 100만원) + 아동수당 120만원(월 10만원) 규모입니다. 여기에 지자체 지원금과 전기요금 할인이 더해집니다.',
  },
  {
    q: '한 번에 다 신청할 수 있나요?',
    a: '네. 주민센터에서 출생신고할 때 행복출산 원스톱 서비스 신청서 하나로 첫만남이용권·부모급여·아동수당·지자체 지원금을 함께 접수할 수 있습니다. 전기요금 할인 등 일부 항목은 별도 신청이 필요할 수 있습니다.',
  },
  {
    q: '소득이 높으면 못 받는 것도 있나요?',
    a: '첫만남이용권·부모급여·아동수당은 소득과 무관합니다. 산후도우미 바우처(기준중위소득 150% 이하 원칙)와 일부 지자체 사업은 소득 기준이 있습니다.',
  },
  {
    q: '60일 기한을 놓치면 어떻게 되나요?',
    a: '부모급여와 아동수당은 출생 후 60일 이내 신청 시에만 출생월부터 소급 지급됩니다. 넘기면 신청한 달부터만 지급되어 놓친 달만큼(0세 기준 월 110만원) 손해입니다.',
  },
  {
    q: '둘째는 더 받나요?',
    a: '첫만남이용권이 300만원으로 늘어나고, 다수 지자체가 둘째 이상에 더 큰 출산지원금을 줍니다. 신생아 특례대출도 추가 출산 시 금리 우대가 있습니다.',
  },
]

export default function SubsidyGuidePage() {
  const jsonLd = guideJsonLd({
    url: `${SITE_URL}/guide/subsidy`,
    title: TITLE,
    description: DESCRIPTION,
    faq: FAQ,
    datePublished: '2026-08-01',
  })

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <GuideTitle lead="출산 지원금은 종류가 많고 신청 창구가 흩어져 있어 놓치기 쉽습니다. 2026년 기준으로 국가 지원과 지자체 지원을 전부 모으고, 각각의 기한과 신청 방법을 정리했습니다. 핵심은 하나 — 출생신고할 때 행복출산 원스톱으로 한 번에 신청하는 것입니다.">
        출산 지원금 총정리 (2026)
      </GuideTitle>

      <H2>가장 중요한 규칙 — 60일</H2>
      <P>
        부모급여와 아동수당은 <B>출생 후 60일 이내에 신청해야 출생한 달부터 소급</B>됩니다.
        60일을 넘기면 신청월부터만 지급됩니다. 0세 기준 부모급여 100만원 + 아동수당 10만원,
        <B> 한 달 놓칠 때마다 110만원이 사라지는 셈</B>입니다. 이 페이지의 모든 항목 중 기한
        손실이 가장 크므로, 출생신고(30일 기한)와 함께 처리하면 자동으로 안전합니다.
      </P>

      <H2>국가 지원 — 소득 무관, 전국 공통</H2>
      <ItemLink
        slug="first-meeting-voucher"
        title="첫만남이용권 — 첫째 200만원 / 둘째 이상 300만원"
        desc="국민행복카드 바우처, 출생 후 1년 내 사용"
      />
      <ItemLink
        slug="parental-benefit"
        title="부모급여 — 0세 월 100만원 / 1세 월 50만원"
        desc="현금 지급, 60일 내 신청 시 출생월 소급"
      />
      <ItemLink
        slug="child-allowance"
        title="아동수당 — 월 10만원"
        desc="만 9세 미만, 부모급여와 중복 수급"
      />
      <ItemLink
        slug="electricity-discount"
        title="전기요금 할인 — 3년간 30%"
        desc="월 16,000원 한도, 한전에 직접 신청"
      />

      <H2>지자체 지원 — 지역마다 다르니 반드시 확인</H2>
      <P>
        시·군·구가 자체 예산으로 주는 지원은 지역 편차가 큽니다. 수십만원 축하금부터 수백만원
        분할 지급까지 다양하고, <B>거주 기간 요건과 신청 기한</B>이 붙는 경우가 많습니다.
        출생신고하러 간 김에 담당 공무원에게 &ldquo;우리 구에서 받을 수 있는 출산 지원을 전부
        알려 달라&rdquo;고 묻는 것이 가장 정확합니다.
      </P>
      <ItemLink
        slug="local-birth-grant"
        title="지자체 출산지원금"
        desc="금액·조건 지역별 상이 — 행복출산 원스톱에 대부분 포함"
      />
      <ItemLink
        slug="postpartum-care-expense"
        title="산후조리경비 지원"
        desc="일부 지자체의 산후조리 비용 지원 — 기한 짧은 곳 주의"
      />

      <H2>지원금은 아니지만 함께 챙길 것</H2>
      <UL>
        <li>
          <B>산모·신생아 건강관리 지원(산후도우미)</B> — 소득 기준이 있는 바우처. 출산 후 30일
          이내 신청.
        </li>
        <li>
          <B>배우자 출산휴가 20일(유급)</B> — 출산일로부터 120일 이내 사용.
        </li>
        <li>
          <B>신생아 특례대출</B> — 출산 2년 이내 가구의 저금리 주택 구입·전세 자금.
        </li>
      </UL>
      <ItemLink
        slug="postpartum-helper"
        title="산후도우미 신청"
        desc="출산 후 30일 이내 — 기준중위소득 150% 이하 원칙, 지자체 예외 있음"
      />
      <ItemLink
        slug="paternity-leave"
        title="배우자 출산휴가 20일"
        desc="전 기간 유급, 120일 내 사용하지 않으면 소멸"
      />
      <ItemLink
        slug="newborn-loan"
        title="신생아 특례대출"
        desc="출산 2년 이내 신청 가능 — 자격 미리 확인"
      />

      <H2>신청 동선 요약</H2>
      <UL>
        <li>
          <B>출생신고 방문 때 (출생 후 30일 내)</B> — 행복출산 원스톱으로 첫만남이용권·부모급여·
          아동수당·지자체 지원금 일괄 신청
        </li>
        <li>
          <B>같은 주에</B> — 한전 123으로 전기요금 할인, 보건소·복지로로 산후도우미 신청
        </li>
        <li>
          <B>여유 있을 때</B> — 신생아 특례대출 자격 확인, 회사 복지(축하금·경조휴가) 신청
        </li>
      </UL>

      <GuideFaq faq={FAQ} />

      <p className="mt-8 text-xs text-ink-faint">
        내용 확인일 2026-08-01 · 2026년 제도 기준. 금액·기준은 매년 바뀌므로 신청 전 복지로·
        정부24에서 최종 확인하세요.
      </p>
    </article>
  )
}
