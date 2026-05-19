'use client';

import Link from 'next/link';
import { ScrollReveal } from '@/shared/ui/ScrollReveal';
import { useLang } from '@/shared/lib/LangContext';
import { JsonLd, faqSchema } from '@/shared/lib/jsonLd';
import { FluentEmoji, type FluentEmojiName } from '@/shared/ui/FluentEmoji';
import { PageHero } from '@/shared/ui/PageHero';
import { PrimaryCTA } from '@/shared/ui/PrimaryCTA';

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

/* ───────── 카테고리 컬러 ───────── */
const CAT = {
  general: { ko: '종합운', en: 'General', icon: 'sparkles',  color: '#7C5CFF' },
  love:    { ko: '애정운', en: 'Love',    icon: 'twoHearts', color: '#FF4D8A' },
  career:  { ko: '직업운', en: 'Career',  icon: 'briefcase', color: '#3B82F6' },
  wealth:  { ko: '재물운', en: 'Wealth',  icon: 'moneyWithWings', color: '#10B981' },
  health:  { ko: '건강운', en: 'Health',  icon: 'health',    color: '#0BA888' },
} as const;

type CatKey = keyof typeof CAT;

/* ───────── 파스텔 카드 배경 ───────── */
const PASTEL = {
  mint:  '#D4F5D8',
  lilac: '#DCD6FF',
  sky:   '#D6E4FF',
  blush: '#FFD9E0',
  cream: '#FFE9C7',
  rose:  '#FFD1D6',
};

interface TodayCard {
  href: string;
  bg: string;
  icon: FluentEmojiName;
  ko: string; en: string;
  subKo: string; subEn: string;
  cat: CatKey;
  isNew?: boolean;
}

const TODAY: TodayCard[] = [
  { href: '/today',         bg: PASTEL.mint,  icon: 'clover',     ko: '오늘의 운세',           en: "Today's Saju",       subKo: '오늘 하루의 기운 흐름',   subEn: "Today's energy flow",         cat: 'general' },
  { href: '/saju',          bg: PASTEL.lilac, icon: 'crystalBall',ko: '내 사주',               en: 'My Saju',            subKo: '원국·오행·십성 한눈에',   subEn: 'Full chart at a glance',      cat: 'general', isNew: true },
  { href: '/chaeun',        bg: PASTEL.sky,   icon: 'moneyWithWings', ko: '재운',              en: 'Wealth',             subKo: '돈의 흐름과 타이밍',     subEn: 'Money flow & timing',         cat: 'wealth',  isNew: true },
  { href: '/career',        bg: PASTEL.cream, icon: 'briefcase',  ko: '커리어',                en: 'Career',             subKo: '직업 적성과 관운',       subEn: 'Career fit & timing',         cat: 'career',  isNew: true },
  { href: '/compatibility', bg: PASTEL.rose,  icon: 'sparkleHeart',ko: '이상형',               en: 'Ideal Match',        subKo: '내게 맞는 상대 역산',     subEn: 'Reverse-engineer your match', cat: 'love',    isNew: true },
  { href: '/couple',        bg: PASTEL.blush, icon: 'loveLetter', ko: '커플 궁합',             en: 'Couple Match',       subKo: '두 사람의 궁합 점수',     subEn: 'Two-person compatibility',    cat: 'love',    isNew: true },
];

interface BestItem {
  href: string;
  ko: string; en: string;
  cat: CatKey;
  count: string;
  free?: boolean;
}

const BEST: BestItem[] = [
  { href: '/saju',          ko: 'MBTI보다 소름 돋는 나의 핵심 성향', en: 'The core trait that beats your MBTI', cat: 'general', count: '5만+', free: true },
  { href: '/compatibility', ko: '본능적으로 끌리는 운명의 상대는?',   en: 'Who you’re instinctively drawn to',    cat: 'love',    count: '3만+', free: true },
  { href: '/career',        ko: '지금 내 직업은 사주랑 잘 맞을까?',   en: 'Does your job match your chart?',     cat: 'career',  count: '3만+', free: true },
  { href: '/chaeun',        ko: '나는 월급쟁이 팔자? 자본가 팔자?',   en: 'Salaryman or capitalist destiny?',     cat: 'wealth',  count: '3만+', free: true },
  { href: '/zodiac',        ko: '띠로 보는 오늘의 흐름',             en: "Today's zodiac flow",                  cat: 'general', count: '4,185', free: true },
];

/* ───────── 페이지 ───────── */
export default function LandingPage() {
  const { t, lang, localePath } = useLang();

  return (
    <main className="min-h-screen" style={{ background: '#FFFFFF', color: '#111111', fontFeatureSettings: '"tnum"' }}>
      <JsonLd data={faqSchema(LANDING_FAQ)} />

      <div className="max-w-[480px] lg:max-w-[960px] mx-auto px-4 sm:px-5 py-5">
        {/* ───── 헤더 ───── */}
        <header className="mb-6">
          <div className="text-[11px] font-bold tracking-[0.16em] uppercase mb-1" style={{ color: '#6B7280' }}>
            Sedaily Saju
          </div>
          <h1 className="text-[24px] font-extrabold leading-[1.2] tracking-[-0.02em]">
            {t('사주매칭', 'SajuMatch')}
          </h1>
        </header>

        {/* ───── 검색 필 (장식) ───── */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-6"
          style={{ background: '#F4F5F7' }}
        >
          <span className="text-[15px]" style={{ color: '#9CA3AF' }}>🔎</span>
          <span className="text-[13.5px]" style={{ color: '#9CA3AF' }}>
            {t('오늘 운세, 사주, 궁합 검색해보세요', 'Search today’s fortune, saju, compatibility')}
          </span>
        </div>

        {/* ───── 오늘의 운세로 하루 시작 ───── */}
        <SectionHeader
          title={t('오늘의 운세로 하루 시작', 'Start your day with a reading')}
          icon="cloudSun"
        />
        <ul
          className="flex gap-3 mb-9 -mx-4 sm:-mx-5 px-4 sm:px-5 overflow-x-auto scrollbar-hide"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {TODAY.map((c, i) => {
            const cat = CAT[c.cat];
            return (
              <ScrollReveal key={c.href + i} delay={i * 50}>
                <li className="shrink-0 w-[160px] sm:w-[180px]" style={{ scrollSnapAlign: 'start' }}>
                  <Link
                    href={localePath(c.href)}
                    className="block no-underline"
                    style={{ color: 'inherit' }}
                  >
                    <div
                      className="relative w-full aspect-[5/6] rounded-[20px] overflow-hidden mb-2.5 transition-transform group-hover:scale-[1.02]"
                      style={{ background: c.bg }}
                    >
                      {c.isNew && (
                        <span
                          className="absolute top-2.5 right-2.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-extrabold"
                          style={{ background: '#FF3B30', color: '#FFF' }}
                        >
                          N
                        </span>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <FluentEmoji name={c.icon} size={96} alt="" />
                      </div>
                    </div>
                    <div className="text-[13.5px] font-bold leading-[1.35] line-clamp-2 mb-1">
                      {t(c.ko, c.en)}
                    </div>
                    <div className="text-[11.5px] mb-1.5" style={{ color: '#9CA3AF' }}>
                      {t(c.subKo, c.subEn)}
                    </div>
                    <div
                      className="text-[11.5px] font-bold inline-flex items-center gap-1"
                      style={{ color: cat.color }}
                    >
                      <FluentEmoji name={cat.icon} size={14} alt="" />
                      <span>{t(cat.ko, cat.en)}</span>
                    </div>
                  </Link>
                </li>
              </ScrollReveal>
            );
          })}
        </ul>

        {/* ───── 무료 사주 베스트 셀러 ───── */}
        <SectionHeader title={t('무료 사주 베스트 셀러', 'Free saju bestsellers')} />
        <ul className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-9">
          {BEST.map((b, i) => {
            const cat = CAT[b.cat];
            return (
              <ScrollReveal key={b.href + i} delay={i * 60}>
                <li>
                  <Link
                    href={localePath(b.href)}
                    className="block rounded-2xl px-5 py-4 no-underline transition-colors"
                    style={{ background: '#F4F5F7', color: '#111111' }}
                  >
                    <div className="text-[15px] font-extrabold leading-[1.4] mb-2">
                      {t(b.ko, b.en)}
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] font-bold flex-wrap">
                      <span className="inline-flex items-center gap-1" style={{ color: cat.color }}>
                        <FluentEmoji name={cat.icon} size={14} alt="" />
                        <span>{t(cat.ko, cat.en)}</span>
                      </span>
                      <span style={{ color: '#9CA3AF' }}>✦</span>
                      <span className="tabular-nums" style={{ color: '#6B7280' }}>
                        {b.count}
                      </span>
                      {b.free && (
                        <>
                          <span style={{ color: '#9CA3AF' }}>·</span>
                          <span style={{ color: '#FF5A36' }}>{t('무료', 'Free')}</span>
                        </>
                      )}
                    </div>
                  </Link>
                </li>
              </ScrollReveal>
            );
          })}
        </ul>

        {/* ───── 메인 Hero CTA ───── */}
        <ScrollReveal>
          <div className="mb-9">
            <PageHero
              eyebrow={t('Saju · Free', 'Saju · Free')}
              title={t(
                '생년월일만 입력하면\n내 사주팔자가 한눈에.',
                'Enter your birthday\nand see your full chart.'
              )}
              subtitle={t(
                '원국 · 오행 · 십성 · 오늘의 일진 · 대운까지 모두 무료로.',
                'Pillars · five elements · ten gods · daily flow · luck cycles. All free.'
              )}
              illustration="crystalBall"
            >
              <Link
                href={localePath('/saju')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold no-underline"
                style={{ background: '#FFF', color: '#111' }}
              >
                {t('내 사주 보러가기', 'See my chart')} <span>→</span>
              </Link>
            </PageHero>
          </div>
        </ScrollReveal>

        {/* ───── 카테고리 둘러보기 ───── */}
        <SectionHeader title={t('카테고리 둘러보기', 'Browse by category')} />
        <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-12">
          {(['general', 'love', 'career', 'wealth', 'health'] as CatKey[]).map((k, i) => {
            const cat = CAT[k];
            const targetByCat: Record<CatKey, string> = {
              general: '/saju',
              love:    '/compatibility',
              career:  '/career',
              wealth:  '/chaeun',
              health:  '/saju',
            };
            return (
              <ScrollReveal key={k} delay={i * 50}>
                <li>
                  <Link
                    href={localePath(targetByCat[k])}
                    className="rounded-2xl py-4 px-2 no-underline flex flex-col items-center gap-1.5 transition-colors"
                    style={{ background: '#F4F5F7' }}
                  >
                    <FluentEmoji name={cat.icon} size={40} alt="" />
                    <span className="text-[12.5px] font-bold" style={{ color: cat.color }}>
                      {t(cat.ko, cat.en)}
                    </span>
                  </Link>
                </li>
              </ScrollReveal>
            );
          })}
        </ul>

        {/* ───── Why this exists ───── */}
        <ScrollReveal>
          <section className="mb-12">
            <div
              className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-5"
              style={{ color: '#6B7280' }}
            >
              {t('Why this exists', 'Why this exists')}
            </div>
            <div className="space-y-2.5 text-[20px] sm:text-[24px] font-extrabold leading-[1.35] tracking-[-0.015em] mb-6">
              <p>{t('사주 앱은 많습니다.', 'Plenty of Korean astrology apps exist.')}</p>
              <p style={{ color: '#9CA3AF' }}>
                {t('해석이 맞는지 검증할 방법이 없죠.', 'No way to check if the reading is right.')}
              </p>
              <p>{t('그래서 근거를 함께 보여드립니다.', 'So we show the sources next to every line.')}</p>
            </div>
            <p className="text-[14px] leading-[1.75] max-w-[620px]" style={{ color: '#3F3F46' }}>
              {t(
                '원국의 오행 분포, 일간의 십성 관계, 대운의 변곡점 — 모든 해석 옆에 왜 그렇게 나왔는지 근거를 함께 띄워드립니다. 사주팔자를 알아야 반박할 수 있고, 근거를 봐야 받아들일 수 있으니까요.',
                'The Five Element distribution, the Ten Gods around your day stem, the pivots in your luck cycle — every interpretation comes with the reasoning behind it. You can only argue with a reading if you know the chart, and only accept it when you see the evidence.'
              )}
            </p>
          </section>
        </ScrollReveal>

        {/* ───── How it works ───── */}
        <ScrollReveal>
          <section className="mb-12">
            <div
              className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-5"
              style={{ color: '#6B7280' }}
            >
              {t('How it works', 'How it works')}
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                {
                  n: '01',
                  bg: PASTEL.lilac,
                  icon: 'crystalBall' as FluentEmojiName,
                  titleKo: '만세력 엔진',
                  titleEn: 'Manseryeok engine',
                  bodyKo: '공인 만세력 데이터를 그대로 사용해, 천간·지지·대운을 분·초 단위까지 계산해드립니다.',
                  bodyEn: 'We use the official manseryeok calendar as-is, resolving Heavenly Stems, Earthly Branches, and luck cycles down to the minute.',
                },
                {
                  n: '02',
                  bg: PASTEL.mint,
                  icon: 'graphUp' as FluentEmojiName,
                  titleKo: '오행·십성 분석',
                  titleEn: 'Five Elements · Ten Gods',
                  bodyKo: '원국의 오행 분포와 일간 기준 십성을 정량화해, 편중된 힘과 결핍된 힘을 짚어드립니다.',
                  bodyEn: 'We quantify the Five Element distribution and the Ten Gods around your day stem, and point out which forces are overloaded and which are missing.',
                },
                {
                  n: '03',
                  bg: PASTEL.cream,
                  icon: 'scroll' as FluentEmojiName,
                  titleKo: '해석 레이어',
                  titleEn: 'Interpretation layer',
                  bodyKo: '고전 명리학의 구절과 현대적 맥락을 연결해, 근거와 함께 해석을 보여드립니다.',
                  bodyEn: 'We connect classical Korean astrology passages to modern context, and hand back interpretations with their sources attached.',
                },
              ].map((s, i) => (
                <ScrollReveal key={s.n} delay={i * 80}>
                  <li
                    className="rounded-[20px] px-5 py-5 h-full"
                    style={{ background: s.bg }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="text-[11px] font-extrabold tracking-[0.18em] tabular-nums"
                        style={{ color: '#3F3F46' }}
                      >
                        {s.n}
                      </div>
                      <FluentEmoji name={s.icon} size={36} alt="" />
                    </div>
                    <h3 className="text-[16px] font-extrabold tracking-[-0.01em] mb-2">
                      {t(s.titleKo, s.titleEn)}
                    </h3>
                    <p className="text-[12.5px] leading-[1.7]" style={{ color: '#3F3F46' }}>
                      {t(s.bodyKo, s.bodyEn)}
                    </p>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        {/* ───── For whom ───── */}
        <ScrollReveal>
          <section className="mb-12">
            <div
              className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-5"
              style={{ color: '#6B7280' }}
            >
              {t('For whom', 'For whom')}
            </div>
            <ul className="space-y-2.5 text-[15px] sm:text-[16px] leading-[1.7]" style={{ color: '#1F2937' }}>
              {[
                { ko: '처음 사주를 보시는 분', en: 'First-time readers of Korean astrology' },
                { ko: '다른 앱의 해석이 왜 그런지 궁금하셨던 분', en: 'Anyone who wondered why another app gave that reading' },
                { ko: '재물·커리어·인연을 한 흐름으로 읽고 싶으신 분', en: 'Readers who want wealth, career, and relationships as one story' },
                { ko: '매일 아침 5분, 오늘을 점검하고 싶으신 분', en: 'Anyone who wants a five-minute read on the day, every morning' },
              ].map((it, i) => (
                <ScrollReveal key={i} delay={i * 80}>
                  <li className="flex gap-3">
                    <span style={{ color: '#9CA3AF' }}>—</span>
                    <span>{t(it.ko, it.en)}</span>
                  </li>
                </ScrollReveal>
              ))}
            </ul>
          </section>
        </ScrollReveal>

        {/* ───── Closing CTA ───── */}
        <ScrollReveal>
          <section className="mb-10">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold leading-[1.3] tracking-[-0.02em] mb-4">
              {t('사주는 미신이 아닙니다.', 'Korean astrology isn’t superstition.')}
              <br />
              <span style={{ color: '#9CA3AF' }}>
                {t('읽을 줄 모르면 미신이 될 뿐이에요.', 'It only becomes superstition when you can’t read it.')}
              </span>
            </h2>
            <p
              className="text-[14px] leading-[1.7] mb-6 max-w-[620px]"
              style={{ color: '#3F3F46' }}
            >
              {t(
                '공개 프리뷰 기간 동안 무료로 이용하실 수 있습니다. 생년월일만 있으면 됩니다.',
                'Free to use during the public preview. All you need is a date of birth.'
              )}
            </p>
            <PrimaryCTA href={localePath('/saju')} icon="sparkles">
              {t('지금 바로 시작하기', 'Start now')}
            </PrimaryCTA>
          </section>
        </ScrollReveal>

        {/* ───── 푸터 안내 ───── */}
        <p className="text-[11px] leading-[1.7] text-center mb-2" style={{ color: '#9CA3AF' }}>
          {t(
            '이 사이트의 해석은 고전 명리학 문헌을 참고한 데이터 기반 콘텐츠로, 오락·참고 목적의 정보이며 어떠한 판단·결정의 근거로도 사용할 수 없습니다.',
            'Interpretations on this site are data-driven content based on classical Korean astrology, for entertainment and reference only, and must not be used as the basis for any decision.'
          )}
        </p>
        <p className="text-[11px] text-center mb-6" style={{ color: '#9CA3AF' }}>
          {t('Copyright ⓒ Sedaily, All rights reserved.', 'Copyright ⓒ Sedaily, All rights reserved.')}
        </p>

        {/* lang 사용을 명시적으로 — useLang 훅 의존 보존용 (eslint no-unused-vars) */}
        <span aria-hidden className="hidden">{lang}</span>
      </div>
    </main>
  );
}

/* ───────── 보조 컴포넌트 ───────── */
function SectionHeader({ title, icon }: { title: string; icon?: FluentEmojiName }) {
  return (
    <div className="flex items-center justify-between mb-3 px-1">
      <h2 className="text-[18px] font-extrabold tracking-[-0.015em] inline-flex items-center gap-1.5">
        <span>{title}</span>
        {icon && <FluentEmoji name={icon} size={20} alt="" />}
      </h2>
      <span className="text-[18px]" style={{ color: '#9CA3AF' }}>›</span>
    </div>
  );
}
