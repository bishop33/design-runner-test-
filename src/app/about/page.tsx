import type { Metadata } from 'next'
import { ExternalLink } from 'lucide-react'
import { DISCLAIMER, SITE_NAME } from '@/data/site'
import { GuideTitle, H2, P, UL } from '@/components/guide'

export const metadata: Metadata = {
  title: '정보 출처 및 면책',
  description: `${SITE_NAME}의 정보 출처, 확인 기준, 개인정보 처리 방식과 면책 안내입니다.`,
  alternates: { canonical: '/about' },
}

const SOURCES = [
  { label: '정부24', url: 'https://www.gov.kr', desc: '출생신고, 행복출산 원스톱 서비스' },
  { label: '복지로', url: 'https://www.bokjiro.go.kr', desc: '부모급여, 아동수당, 첫만남이용권, 산모·신생아 건강관리' },
  { label: '보건복지부', url: 'https://www.mohw.go.kr', desc: '출산·양육 지원 제도 총괄' },
  { label: '사회서비스전자바우처', url: 'https://www.socialservice.or.kr', desc: '국민행복카드, 제공기관 조회' },
  { label: '임신육아종합포털 아이사랑', url: 'https://www.childcare.go.kr', desc: '어린이집 입소대기, 지역별 혜택' },
  { label: '고용노동부·고용24', url: 'https://www.moel.go.kr', desc: '배우자 출산휴가, 육아휴직' },
  { label: '질병관리청 예방접종도우미', url: 'https://nip.kdca.go.kr', desc: '국가예방접종 일정' },
  { label: '국민건강보험공단', url: 'https://www.nhis.or.kr', desc: '피부양자 등록, 영유아 건강검진' },
  { label: '주택도시기금', url: 'https://nhuf.molit.go.kr', desc: '신생아 특례대출' },
  { label: '국세청 홈택스', url: 'https://hometax.go.kr', desc: '증여세 신고, 연말정산' },
]

export default function AboutPage() {
  return (
    <article>
      <GuideTitle lead="이 서비스가 어떤 기준으로 정보를 정리하고, 무엇을 보장하지 않는지 밝힙니다.">
        정보 출처 및 면책
      </GuideTitle>

      <H2>정보 기준</H2>
      <P>
        모든 항목은 2026년 제도를 기준으로 작성했으며, 각 항목 카드와 상세 페이지에 마지막 확인
        날짜(lastVerified)를 표시합니다. 제도는 매년, 때로는 연중에도 바뀌므로 확인일 이후
        변경이 있을 수 있습니다.
      </P>

      <H2>공식 출처</H2>
      <ul className="mt-3 space-y-3">
        {SOURCES.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-medium text-accent underline underline-offset-2"
            >
              {s.label}
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
            <p className="mt-0.5 text-sm text-ink-muted">{s.desc}</p>
          </li>
        ))}
      </ul>

      <H2>개인정보</H2>
      <UL>
        <li>이 서비스에는 로그인·서버·데이터베이스가 없습니다.</li>
        <li>
          입력한 출생일과 체크 상태는 사용자의 브라우저(localStorage)와 URL에만 존재하며, 어떤
          서버로도 전송되지 않습니다.
        </li>
        <li>브라우저 데이터를 지우면 체크 상태도 함께 삭제됩니다.</li>
      </UL>

      <H2>면책</H2>
      <P>{DISCLAIMER}</P>
      <P>
        이 사이트의 정보로 인해 발생한 불이익에 대해 법적 책임을 지지 않습니다. 지원금 신청
        기한, 서류, 지급 금액은 반드시 해당 기관의 공식 안내로 최종 확인하시기 바랍니다.
      </P>
    </article>
  )
}
