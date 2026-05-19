'use client';

import Link from 'next/link';
import {
  ScrollText, Sun, Coins, Briefcase, Heart, Users, Rabbit, Newspaper,
  type LucideIcon,
} from 'lucide-react';
import { ScrollReveal } from '@/shared/ui/ScrollReveal';
import { useLang } from '@/shared/lib/LangContext';
import { LangToggle } from '@/shared/lib/LangToggle';
import { JsonLd, faqSchema } from '@/shared/lib/jsonLd';

const LANDING_FAQ = [
  {
    q: '사주매칭은 어떤 서비스인가요?',
    a: '생년월일시만 입력하면 원국·십성·대운·오늘의 일진·재운·커리어·궁합까지 한 화면에서 풀어주는 데이터 기반 사주 서비스입니다. 궁통보감·삼명통회·자평진전 3대 고전과 KASI 만세력을 참고합니다.',
  },
  {
    q: '무료인가요?',
    a: '공개 프리뷰 기간 동안 모든 기능을 무료로 이용하실 수 있습니다. 별도 회원가입도 필요하지 않습니다.',
  },
  {
    q: '궁합 추천은 어떻게 계산되나요?',
    a: '내 사주의 결핍·과잉 오행을 보완하는 상대의 원국을 역산합니다. 부족한 오행 +4, 과한 오행의 통제자 +2, 천간합 파트너 +3, 성별별 배우자궁(남자는 재성, 여자는 관성) 가중 +2를 합산해 추천 천간·지지·태어난 해·달까지 제시합니다.',
  },
  {
    q: '태어난 시간을 모르면 어떻게 하나요?',
    a: '시간 입력란의 "시간 모름" 옵션을 체크하시면 시주를 제외한 年·月·日 세 기둥으로 해석해드립니다. 해석의 정밀도는 떨어지지만 핵심 흐름은 충분히 파악할 수 있습니다.',
  },
  {
    q: '해석을 판단 근거로 써도 되나요?',
    a: '아니요. 이 사이트의 해석은 고전 명리학 문헌을 참고한 데이터 기반 콘텐츠로, 오락·참고 목적의 정보이며 의료·법률·재무·진로 등 어떠한 판단·결정의 근거로도 사용할 수 없습니다.',
  },
];

// 오행 5색 — SajuTable.tsx 의 EL_COLORS 팔레트와 동일 기준
const OH_TILE: Record<string, { box: string; icon: string; hoverBox: string }> = {
  목: { box: 'bg-green-50',  icon: 'text-green-600',  hoverBox: 'group-hover:bg-green-600' },
  화: { box: 'bg-red-50',    icon: 'text-red-500',    hoverBox: 'group-hover:bg-red-500' },
  토: { box: 'bg-yellow-50', icon: 'text-yellow-600', hoverBox: 'group-hover:bg-yellow-500' },
  금: { box: 'bg-gray-100',  icon: 'text-gray-500',   hoverBox: 'group-hover:bg-gray-500' },
  수: { box: 'bg-blue-50',   icon: 'text-blue-600',   hoverBox: 'group-hover:bg-blue-600' },
};

const SERVICES: {
  href: string; ko: string; en: string; descKo: string; descEn: string; Icon: LucideIcon; oh: keyof typeof OH_TILE;
}[] = [
  { href: '/saju',          ko: '내 사주',     en: 'My Saju',      descKo: '원국·오행·십성 한눈에',   descEn: 'Your full chart at a glance', Icon: ScrollText, oh: '목' },
  { href: '/today',         ko: '오늘의 운세', en: "Today's Saju", descKo: '오늘 하루의 기운 흐름',   descEn: "Today's energy flow",         Icon: Sun,        oh: '화' },
  { href: '/chaeun',        ko: '재운',        en: 'Wealth',       descKo: '돈의 흐름과 타이밍',     descEn: 'Money flow & timing',         Icon: Coins,      oh: '토' },
  { href: '/career',        ko: '커리어',      en: 'Career',       descKo: '직업 적성과 관운',       descEn: 'Career fit & timing',         Icon: Briefcase,  oh: '금' },
  { href: '/compatibility', ko: '이상형',      en: 'Ideal Match',  descKo: '내게 맞는 상대 역산',     descEn: 'Reverse-engineer your match', Icon: Heart,      oh: '수' },
  { href: '/couple',        ko: '커플 궁합',   en: 'Couple Match', descKo: '두 사람의 궁합 점수',     descEn: 'Two-person compatibility',    Icon: Users,      oh: '수' },
  { href: '/zodiac',        ko: '띠별 운세',   en: 'Zodiac',       descKo: '12지신 오늘의 운세',     descEn: "Today's 12 zodiac signs",     Icon: Rabbit,     oh: '목' },
  { href: '/blog',          ko: '블로그',      en: 'Blog',         descKo: '운세 이야기와 가이드',     descEn: 'Fortune stories & guides',    Icon: Newspaper,  oh: '금' },
];

export default function LandingPage() {
  const { t, localePath } = useLang();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <JsonLd data={faqSchema(LANDING_FAQ)} />

      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[17px] font-bold tracking-[-0.01em] text-slate-900">
              {t('사주매칭', 'SajuMatch')}
            </div>
            <div className="text-[11.5px] text-slate-500 truncate">
              {t('생년월일 하나로 푸는 데이터 사주', 'Data-driven Saju from one birth date')}
            </div>
          </div>
          <LangToggle />
        </div>
      </header>

      {/* Service launcher */}
      <section className="border-b border-slate-200">
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-10 sm:py-14">
          <ScrollReveal>
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-slate-500 uppercase mb-1.5">
              {t('데이터로 푸는 명리학', 'Data-driven Korean astrology')}
            </p>
            <h1 className="text-[22px] sm:text-[26px] font-bold tracking-[-0.01em] mb-6">
              {t('무엇을 볼까요?', 'What would you like to read?')}
            </h1>
          </ScrollReveal>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SERVICES.map(({ href, ko, en, descKo, descEn, Icon, oh }, i) => (
              <ScrollReveal key={href} delay={i * 60}>
                <li className="h-full">
                  <Link
                    href={localePath(href)}
                    className="group flex flex-col h-full rounded-2xl border border-slate-200 bg-white p-4 hover:border-slate-300 hover:shadow-sm transition-all"
                  >
                    <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl mb-3 transition-colors group-hover:text-white ${OH_TILE[oh].box} ${OH_TILE[oh].icon} ${OH_TILE[oh].hoverBox}`}>
                      <Icon size={20} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="text-[15px] font-bold text-slate-900 leading-tight">
                      {t(ko, en)}
                    </span>
                    <span className="mt-1 text-[12px] leading-[1.45] text-slate-500">
                      {t(descKo, descEn)}
                    </span>
                  </Link>
                </li>
              </ScrollReveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Pitch */}
      <section className="border-b border-slate-200">
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-slate-500 uppercase mb-6">
              {t('Why this exists', 'Why this exists')}
            </p>
          </ScrollReveal>
          <div className="space-y-3 text-[22px] sm:text-[28px] font-semibold leading-[1.35] tracking-[-0.01em]">
            <ScrollReveal delay={0}>
              <p>{t('사주 앱은 많습니다.', 'Plenty of Korean astrology apps exist.')}</p>
            </ScrollReveal>
            <ScrollReveal delay={140}>
              <p className="text-slate-400">
                {t('해석이 맞는지 검증할 방법이 없죠.', 'No way to check if the reading is right.')}
              </p>
            </ScrollReveal>
            <ScrollReveal delay={280}>
              <p>{t('그래서 근거를 함께 보여드립니다.', 'So we show the sources next to every line.')}</p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={420}>
            <p className="mt-8 text-[15px] sm:text-[16px] leading-[1.7] text-slate-700 max-w-[620px]">
              {t(
                '원국의 오행 분포, 일간의 십성 관계, 대운의 변곡점 — 모든 해석 옆에 왜 그렇게 나왔는지 근거를 함께 띄워드립니다. 사주팔자를 알아야 반박할 수 있고, 근거를 봐야 받아들일 수 있으니까요.',
                'The Five Element distribution, the Ten Gods around your day stem, the pivots in your luck cycle — every interpretation comes with the reasoning behind it. You can only argue with a reading if you know the chart, and only accept it when you see the evidence.'
              )}
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Method */}
      <section className="border-b border-slate-200">
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-slate-500 uppercase mb-8">
              {t('How it works', 'How it works')}
            </p>
          </ScrollReveal>
          <div className="grid sm:grid-cols-2 gap-x-10 gap-y-8">
            <ScrollReveal delay={0}>
              <Step
                n="01"
                title={t('만세력 엔진', 'Manseryeok engine')}
                body={t(
                  '공인 만세력 데이터를 그대로 사용해, 천간·지지·대운을 분·초 단위까지 계산해드립니다.',
                  'We use the official manseryeok calendar as-is, resolving Heavenly Stems, Earthly Branches, and luck cycles down to the minute.'
                )}
              />
            </ScrollReveal>
            <ScrollReveal delay={120}>
              <Step
                n="02"
                title={t('오행·십성 분석', 'Five Elements · Ten Gods')}
                body={t(
                  '원국의 오행 분포와 일간 기준 십성을 정량화해, 편중된 힘과 결핍된 힘을 짚어드립니다.',
                  'We quantify the Five Element distribution and the Ten Gods around your day stem, and point out which forces are overloaded and which are missing.'
                )}
              />
            </ScrollReveal>
            <ScrollReveal delay={240}>
              <Step
                n="03"
                title={t('해석 레이어', 'Interpretation layer')}
                body={t(
                  '고전 명리학의 구절과 현대적 맥락을 연결해, 근거와 함께 해석을 보여드립니다.',
                  'We connect classical Korean astrology passages to modern context, and hand back interpretations with their sources attached.'
                )}
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* For whom */}
      <section className="border-b border-slate-200">
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-14 sm:py-20">
          <ScrollReveal>
            <p className="text-[12px] sm:text-[13px] font-semibold tracking-[0.12em] text-slate-500 uppercase mb-8">
              {t('For whom', 'For whom')}
            </p>
          </ScrollReveal>
          <ul className="space-y-3 text-[16px] sm:text-[17px] leading-[1.6] text-slate-800">
            <ScrollReveal delay={0}>
              <li className="flex gap-3">
                <span className="text-slate-400">—</span>
                {t('처음 사주를 보시는 분', 'First-time readers of Korean astrology')}
              </li>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <li className="flex gap-3">
                <span className="text-slate-400">—</span>
                {t('다른 앱의 해석이 왜 그런지 궁금하셨던 분', 'Anyone who wondered why another app gave that reading')}
              </li>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <li className="flex gap-3">
                <span className="text-slate-400">—</span>
                {t('재물·커리어·인연을 한 흐름으로 읽고 싶으신 분', 'Readers who want wealth, career, and relationships as one story')}
              </li>
            </ScrollReveal>
            <ScrollReveal delay={300}>
              <li className="flex gap-3">
                <span className="text-slate-400">—</span>
                {t('매일 아침 5분, 오늘을 점검하고 싶으신 분', 'Anyone who wants a five-minute read on the day, every morning')}
              </li>
            </ScrollReveal>
          </ul>
        </div>
      </section>

      {/* Closing CTA */}
      <section>
        <div className="max-w-[780px] mx-auto px-6 sm:px-8 py-16 sm:py-24">
          <ScrollReveal>
            <h2 className="text-[26px] sm:text-[34px] font-bold leading-[1.25] tracking-[-0.01em] mb-4">
              {t('사주는 미신이 아닙니다.', 'Korean astrology isn’t superstition.')}
              <br />
              <span className="text-slate-400">
                {t('읽을 줄 모르면 미신이 될 뿐이에요.', 'It only becomes superstition when you can’t read it.')}
              </span>
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={140}>
            <p className="text-[15px] sm:text-[16px] leading-[1.7] text-slate-700 max-w-[620px] mb-8">
              {t(
                '공개 프리뷰 기간 동안 무료로 이용하실 수 있습니다. 생년월일만 있으면 됩니다.',
                'Free to use during the public preview. All you need is a date of birth.'
              )}
            </p>
          </ScrollReveal>
          <ScrollReveal delay={240}>
            <Link
              href={localePath('/saju')}
              className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-slate-900 text-white text-[15px] font-semibold hover:bg-slate-800 transition-colors"
            >
              {t('지금 바로 시작하기 →', 'Start now →')}
            </Link>
          </ScrollReveal>
          <ScrollReveal delay={340}>
            <p className="mt-10 text-[12px] text-slate-500 leading-[1.6] max-w-[560px]">
              {t(
                '이 사이트의 해석은 고전 명리학 문헌을 참고한 데이터 기반 콘텐츠로, 오락·참고 목적의 정보이며 어떠한 판단·결정의 근거로도 사용할 수 없습니다.',
                'Interpretations on this site are data-driven content based on classical Korean astrology literature. They are provided for entertainment and reference only, and must not be used as the basis for any decision.'
              )}
            </p>
          </ScrollReveal>
        </div>
      </section>
    </main>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div>
      <div className="text-[12px] font-semibold tracking-[0.12em] text-slate-400 mb-2">{n}</div>
      <h3 className="text-[17px] font-semibold text-slate-900 mb-2 tracking-[-0.01em]">{title}</h3>
      <p className="text-[14.5px] leading-[1.65] text-slate-700">{body}</p>
    </div>
  );
}