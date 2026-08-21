import type { Metadata } from 'next'
import { SITE_URL } from '@/data/site'
import { B, GuideFaq, GuideTitle, H2, ItemLink, OL, P, UL, guideJsonLd } from '@/components/guide'

const TITLE = '산후도우미 신청 가이드 — 정부지원 바우처 대상·기한·업체 선택 (2026)'
const DESCRIPTION =
  '산모·신생아 건강관리 지원사업(산후도우미 바우처)의 신청 자격, 출산 후 30일 기한, 맞벌이 소득 계산법, 지자체 예외지원, 업체 고르는 법까지. 2026년 기준으로 신청부터 서비스 시작까지 순서대로 안내합니다.'

export const metadata: Metadata = {
  title: '산후도우미 신청 가이드 — 정부지원 바우처 대상·기한·방법',
  description: DESCRIPTION,
  alternates: { canonical: '/guide/postpartum-care' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/guide/postpartum-care',
    images: [{ url: '/api/og?slug=postpartum-helper', width: 1200, height: 630 }],
  },
}

const FAQ = [
  {
    q: '언제 신청하는 게 가장 좋나요?',
    a: '출산예정일 40일 전부터 신청할 수 있으므로 임신 후기에 미리 신청해 두는 것이 가장 안전합니다. 출산 후라면 30일 기한 안에 서두르세요.',
  },
  {
    q: '소득 기준(중위 150%)을 넘으면 끝인가요?',
    a: '아닙니다. 많은 지자체가 150% 초과 가구에도 예외지원을 합니다. 관할 보건소에 지자체 기준을 꼭 확인하세요. 맞벌이는 낮은 쪽 보험료를 절반만 반영하므로 생각보다 기준 안에 드는 경우가 많습니다.',
  },
  {
    q: '바우처로 얼마나 지원되나요?',
    a: '태아 유형(단태아·쌍태아), 출산 순위, 소득 구간, 선택한 이용 기간에 따라 정부지원금과 본인부담금이 달라집니다. 복지로에서 모의계산이 가능하고, 업체 견적과 비교해 결정하면 됩니다.',
  },
  {
    q: '민간 산후도우미와 뭐가 다른가요?',
    a: '정부 바우처는 시·군·구에 등록된 제공기관에서만 쓸 수 있습니다. 등록업체는 관리사 교육·배상보험 등 요건을 갖추고 있으며, 비용의 상당 부분을 바우처로 차감합니다.',
  },
  {
    q: '친정어머니가 도와주시기로 했는데 신청할 필요가 있나요?',
    a: '가족 돌봄과 별개로, 요건이 되면 바우처는 신청해 두는 것을 권합니다. 기한(출산 후 30일)이 지나면 되살릴 수 없고, 산모 회복 상황은 예측이 어렵기 때문입니다.',
  },
]

export default function PostpartumCareGuidePage() {
  const jsonLd = guideJsonLd({
    url: `${SITE_URL}/guide/postpartum-care`,
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
      <GuideTitle lead="산모·신생아 건강관리 지원사업은 건강관리사가 집으로 와 산모 회복과 신생아 돌봄을 돕는 서비스 비용을 정부가 바우처로 지원하는 제도입니다. 기한이 출산 후 30일로 짧고, 신청·업체 예약이 별개 절차라 놓치기 쉬운 지점을 중심으로 정리했습니다.">
        산후도우미 신청 가이드
      </GuideTitle>

      <H2>세 가지만 기억하세요</H2>
      <UL>
        <li>
          <B>기한: 출산 후 30일</B> (출산예정일 40일 전부터 신청 가능 — 임신 중 신청이 최선)
        </li>
        <li>
          <B>소득 기준에 걸려도 포기 금지</B> — 맞벌이 감경 계산과 지자체 예외지원이 있습니다
        </li>
        <li>
          <B>바우처 신청과 업체 예약은 별개</B> — 인기 업체는 한 달 전에 마감됩니다
        </li>
      </UL>

      <H2>지원 대상 (2026년 기준)</H2>
      <P>
        기본 기준은 <B>기준중위소득 150% 이하</B> 가구입니다. 건강보험료 납부액으로 판정하며,
        <B> 맞벌이 부부는 보험료가 낮은 쪽을 1/2만 반영해 합산</B>합니다. 예를 들어 부부가 각각
        20만원·10만원을 낸다면 20만원 + 5만원 = 25만원으로 판정하므로, 단순 합산보다 기준 안에
        들 가능성이 큽니다.
      </P>
      <P>
        150%를 초과하는 가구도 <B>지자체 예외지원</B>으로 대상이 되는 지역이 많습니다. 신청 전에
        관할 보건소에 전화 한 통으로 확인하세요. &ldquo;소득 기준이 넘어서 안 될 것&rdquo;이라고
        지레 포기하는 것이 이 제도에서 가장 흔한 실수입니다.
      </P>
      <P>
        <B>미숙아·선천성 이상아</B>로 아기가 입원한 경우에는 기한이 <B>퇴원일로부터 30일</B>로
        연장됩니다. NICU 입원 중이라면 조급해하지 말고 퇴원 일정에 맞춰 준비하면 됩니다.
      </P>

      <H2>신청 절차</H2>
      <OL>
        <li>
          <B>국민행복카드 확인</B> — 바우처가 이 카드에 적립됩니다. 임신 중 쓰던 카드가 있으면
          그대로 사용.
        </li>
        <li>
          <B>신청</B> — 복지로·정부24 온라인 또는 산모 주소지 관할 보건소 방문. 건강보험료
          납부확인서(맞벌이는 부부 모두), 출생증명서 등을 준비합니다.
        </li>
        <li>
          <B>지원 결정 통지</B> — 소득 판정 후 지원 구간이 결정되고 바우처가 적립됩니다.
        </li>
        <li>
          <B>등록업체 계약</B> — 사회서비스전자바우처 홈페이지에서 지역 등록기관을 조회해
          계약하고 서비스 일정을 잡습니다.
        </li>
      </OL>

      <H2>업체 고르는 법</H2>
      <UL>
        <li>등록기관 여부가 첫 번째 — 등록업체가 아니면 바우처를 못 씁니다.</li>
        <li>2~3곳 견적 비교 — 같은 지원 구간이라도 업체 단가에 따라 본인부담금이 다릅니다.</li>
        <li>관리사 프로필 사전 공유·교체 정책·연장 정산 방식을 계약 전에 확인합니다.</li>
        <li>시작일은 조리원 퇴소일에 맞추는 경우가 가장 많습니다. 변동 가능성을 미리 협의하세요.</li>
      </UL>

      <H2>체크리스트에서 관리하기</H2>
      <ItemLink
        slug="postpartum-helper"
        title="산후도우미 신청"
        desc="출산 후 30일 이내 — D-day 자동 계산"
      />
      <ItemLink
        slug="postpartum-helper-booking"
        title="산후도우미 업체 예약"
        desc="등록기관 조회·견적 비교·일정 확정"
      />
      <ItemLink
        slug="happiness-card"
        title="국민행복카드 발급 확인"
        desc="바우처 수령의 전제조건"
      />

      <GuideFaq faq={FAQ} />

      <p className="mt-8 text-xs text-ink-faint">
        내용 확인일 2026-08-01 · 2026년 제도 기준. 지원 구간·기간·본인부담금은 지자체와 소득
        구간에 따라 다르므로 관할 보건소에서 최종 확인하세요.
      </p>
    </article>
  )
}
