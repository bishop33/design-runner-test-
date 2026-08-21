import type { Metadata } from 'next'
import { SITE_URL } from '@/data/site'
import { B, GuideFaq, GuideTitle, H2, ItemLink, OL, P, UL, guideJsonLd } from '@/components/guide'

const TITLE = '출생신고 완벽 가이드 — 기한·서류·온라인 신고·과태료 (2026)'
const DESCRIPTION =
  '출생신고는 출생 후 30일 이내가 법정 기한입니다. 필요 서류, 주민센터 방문과 정부24 온라인 신고 방법, 과태료 기준, 신고 후 바로 해야 할 지원금 신청까지 순서대로 정리했습니다.'

export const metadata: Metadata = {
  title: '출생신고 완벽 가이드 — 기한·서류·온라인 신고 방법',
  description: DESCRIPTION,
  alternates: { canonical: '/guide/birth-report' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: '/guide/birth-report',
    images: [{ url: '/api/og?slug=birth-registration', width: 1200, height: 630 }],
  },
}

const FAQ = [
  {
    q: '출생신고는 꼭 부모가 해야 하나요?',
    a: '혼인 중 출생자는 부 또는 모가 신고 의무자입니다. 부모가 신고할 수 없는 사정이 있으면 동거 친족 등이 할 수 있으나, 일반적으로는 부모 중 한 사람이 신분증과 출생증명서를 들고 가면 됩니다.',
  },
  {
    q: '태어난 지역이 아닌 곳에서도 신고할 수 있나요?',
    a: '네. 출생신고는 전국 어느 읍·면·동 주민센터에서나 가능합니다. 다만 주소지 주민센터로 가면 행복출산 원스톱 서비스(지원금 통합신청)를 함께 처리할 수 있어 한 번에 끝납니다.',
  },
  {
    q: '이름이 아직 안 정해졌는데 신고만 먼저 할 수 있나요?',
    a: '안 됩니다. 출생신고서에 이름을 기재해야 하므로 이름 확정이 먼저입니다. 기한(30일)에 몰리지 않도록 미리 정해 두세요.',
  },
  {
    q: '출생신고 후 주민등록번호는 언제 나오나요?',
    a: '방문 신고는 보통 당일~수일 내 처리됩니다. 온라인 신고는 심사에 며칠 걸릴 수 있습니다. 주민등록번호가 나와야 지원금·건강보험·입소대기 등록이 가능합니다.',
  },
  {
    q: '30일이 지났으면 어떻게 하나요?',
    a: '지금 바로 신고하세요. 지연 기간에 따라 과태료(최대 5만원)가 부과되지만 신고 자체는 언제든 가능합니다. 부모급여·아동수당의 60일 소급 기한이 남아 있다면 서두를수록 손실이 줄어듭니다.',
  },
]

export default function BirthReportGuidePage() {
  const jsonLd = guideJsonLd({
    url: `${SITE_URL}/guide/birth-report`,
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
      <GuideTitle lead="출생신고는 아기의 주민등록번호를 만드는 절차이자, 모든 지원금 신청의 출발점입니다. 기한은 출생 후 30일. 이 글 하나로 서류 준비부터 신고 후 할 일까지 끝낼 수 있게 정리했습니다.">
        출생신고 완벽 가이드
      </GuideTitle>

      <H2>기한 — 출생 후 30일, 과태료보다 무서운 것</H2>
      <P>
        가족관계등록법상 출생신고 기한은 <B>출생일로부터 30일</B>입니다. 기한을 넘기면 지연
        기간에 따라 <B>과태료가 최대 5만원</B> 부과됩니다. 그런데 실무에서 더 아픈 손실은
        과태료가 아니라 일정입니다. 신고가 늦어지면 주민등록번호 발급이 늦어지고, 부모급여·
        아동수당의 <B>출생 후 60일 소급 기한</B> 안에서 쓸 수 있는 시간이 줄어듭니다.
      </P>

      <H2>준비물</H2>
      <UL>
        <li>
          <B>출생증명서 원본 1부</B> — 출산 병원에서 발급. 퇴원할 때 2~3부를 받아 두면 보험·회사
          제출에도 쓸 수 있습니다.
        </li>
        <li>
          <B>신고인 신분증</B> — 부 또는 모.
        </li>
        <li>
          <B>아기 이름(한자 포함)</B> — 한자 이름은 대법원 인명용 한자표에 있는 글자만 등록
          됩니다. 신고서에 본(本)과 등록기준지도 적으므로 미리 확인해 가세요.
        </li>
      </UL>

      <H2>방법 1 — 주민센터 방문 (권장)</H2>
      <OL>
        <li>주소지 읍·면·동 주민센터 방문 (전국 어디서나 가능하지만 주소지가 가장 효율적)</li>
        <li>출생신고서 작성 — 이름·본·등록기준지 기재</li>
        <li>
          같은 자리에서 <B>행복출산 원스톱 서비스</B> 신청 — 첫만남이용권, 부모급여, 아동수당,
          지자체 출산지원금을 한 장의 신청서로 접수
        </li>
        <li>건강보험 피부양자 등록·전기요금 할인 연계 처리 여부도 그 자리에서 문의</li>
      </OL>
      <P>
        방문 한 번으로 신고와 지원금 신청을 끝내는 것이 이 경로의 가장 큰 장점입니다. 아기를
        데리고 다시 나오기 어려운 시기라는 점을 생각하면, 처음부터 주소지 주민센터로 가는 것을
        권합니다.
      </P>

      <H2>방법 2 — 정부24 온라인 신고</H2>
      <P>
        출산 병원이 온라인 출생신고 참여 의료기관이고 출생증명 정보 제공에 동의했다면, 정부24
        에서 공동인증(간편인증)으로 신고할 수 있습니다. 병원이 참여 기관인지 먼저 확인하세요.
        온라인 신고 후에도 지원금(행복출산 원스톱)은 복지로·정부24에서 별도로 신청해야 합니다.
      </P>

      <H2>신고가 끝나면 바로 할 일</H2>
      <P>
        주민등록번호가 나오는 순간부터 아래 절차가 줄줄이 열립니다. 순서대로 처리하세요.
      </P>
      <ItemLink
        slug="first-meeting-voucher"
        title="첫만남이용권"
        desc="첫째 200만원 / 둘째 이상 300만원 바우처"
      />
      <ItemLink
        slug="parental-benefit"
        title="부모급여"
        desc="0세 월 100만원 — 60일 내 신청해야 출생월부터 소급"
      />
      <ItemLink
        slug="child-allowance"
        title="아동수당"
        desc="월 10만원 — 부모급여와 중복 수급"
      />
      <ItemLink
        slug="health-insurance-dependent"
        title="건강보험 피부양자 등록"
        desc="아기 병원 진료에 건강보험 적용"
      />
      <ItemLink
        slug="daycare-waitlist"
        title="아이사랑 입소대기 등록"
        desc="대기순번은 신청일 기준 — 번호 나오면 바로"
      />

      <GuideFaq faq={FAQ} />

      <p className="mt-8 text-xs text-ink-faint">
        내용 확인일 2026-08-01 · 2026년 제도 기준. 세부 절차는 관할 주민센터에서 최종
        확인하세요.
      </p>
    </article>
  )
}
