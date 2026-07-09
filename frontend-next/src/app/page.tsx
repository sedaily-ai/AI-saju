'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ScrollText, Sun, Coins, Briefcase, Heart, Users, Rabbit, Newspaper,
  Search, BookOpen, Home,
  type LucideIcon,
} from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';
import { JsonLd, faqSchema } from '@/shared/lib/jsonLd';
import { HeroBanner } from '@/widgets/HeroBanner';

// 명조체 인라인 (한자/특수 강조용) — globals.css 안 건드림, 시스템 fallback chain
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", "Apple SD Gothic Neo", serif';

// 한지 노이즈 (SVG turbulence, 인라인 data URL — 외부 요청 0)
const HANJI_NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.18  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

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
    q: '태어난 시간을 모르면 어떻게 하나요?',
    a: '시간 입력란의 "시간 모름" 옵션을 체크하시면 시주를 제외한 年·月·日 세 기둥으로 해석해드립니다.',
  },
];

// 점신 결 — 톤 통일. 메인 워밍 오렌지 + 4 보조톤만.
const C = {
  paper: '#FFFFFF',     // 페이지 배경 (흰색)
  card: '#FFFFFF',
  ink: '#1A1A1A',
  inkSub: '#A0A0A8',
  inkSoft: '#4F4F58',
  line: '#EFEAE3',
  warm: '#34D399',
  warmSoft: '#D1FAE5',
  warmDeep: '#059669',
  cream: '#D1FAE5',
  rose: '#FFE2DE',
  roseDeep: '#C8513F',
  lilac: '#EFE7FF',
  lilacDeep: '#7A5BE0',
  mint: '#DBF1E8',
  mintDeep: '#338A6A',
};

type Tile = {
  href: string;
  ko: string;
  en: string;
  subKo: string;
  subEn: string;
  Icon: LucideIcon;
  group: 'core' | 'wealth' | 'love' | 'info';
  kanji: string;
};

// 4톤 그룹화 — 사탕색 8색 폐기
const PRIMARY_GRID: Tile[] = [
  { href: '/saju',          ko: '내 사주',     en: 'My Saju',         subKo: '천간·십성·대운 풀이', subEn: 'Stems · Stars · Luck',  Icon: ScrollText, group: 'core',   kanji: '命' },
  { href: '/today',         ko: '오늘 운세',   en: "Today",           subKo: '오늘의 딱 맞는 한 줄', subEn: "Today's one-liner",     Icon: Sun,        group: 'core',   kanji: '日' },
  { href: '/zodiac',        ko: '띠별 운세',   en: 'Zodiac',          subKo: '12지신 오늘의 운세', subEn: '12 zodiac fortunes',     Icon: Rabbit,     group: 'core',   kanji: '辰' },
  { href: '/chaeun',        ko: '재물운',      en: 'Wealth',          subKo: '돈이 들어오는 흐름', subEn: 'Money flow',             Icon: Coins,      group: 'wealth', kanji: '財' },
  { href: '/career',        ko: '커리어',      en: 'Career',          subKo: '적성과 진로 방향', subEn: 'Career direction',         Icon: Briefcase,  group: 'wealth', kanji: '業' },
  { href: '/compatibility', ko: '연애운',      en: 'Ideal',           subKo: '인연이 오는 시기', subEn: 'When love comes',          Icon: Heart,      group: 'love',   kanji: '緣' },
  { href: '/couple',        ko: '커플 궁합',   en: 'Couple',          subKo: '둘의 궁합 점수', subEn: 'Couple score',               Icon: Users,      group: 'love',   kanji: '合' },
  { href: '/news',          ko: '경제 뉴스',   en: 'News',            subKo: '오늘의 경제 소식', subEn: "Today's economy",          Icon: Newspaper,  group: 'info',   kanji: '報' },
];

// 카드별 개별 색상 — 각 메뉴마다 고유한 톤
const TILE_TONE: Record<string, { bg: string; fg: string }> = {
  '/saju':          { bg: '#E8F5E9', fg: '#2E7D32' },   // 녹색 — 사주 핵심
  '/today':         { bg: '#E0F2F1', fg: '#00796B' },   // 틸 — 오늘 운세
  '/zodiac':        { bg: '#FFF3E0', fg: '#E65100' },   // 주황 — 띠별 운세
  '/chaeun':        { bg: '#FFF8E1', fg: '#F57F17' },   // 골드 — 재물
  '/career':        { bg: '#EDE7F6', fg: '#5E35B1' },   // 보라 — 커리어
  '/compatibility': { bg: '#FCE4EC', fg: '#C62828' },   // 핑크 — 연애
  '/couple':        { bg: '#F3E5F5', fg: '#8E24AA' },   // 라벤더 — 커플
  '/news':          { bg: '#E3F2FD', fg: '#1565C0' },   // 블루 — 뉴스
};

const GROUP_TONE: Record<Tile['group'], { bg: string; fg: string }> = {
  core:   { bg: '#E8F5E9', fg: '#2E7D32' },
  wealth: { bg: '#FFF8E1', fg: '#F57F17' },
  love:   { bg: '#FCE4EC', fg: '#C62828' },
  info:   { bg: '#E3F2FD', fg: '#1565C0' },
};



export default function LandingPage() {
  const { t, lang, localePath } = useLang();
  const [today, setToday] = useState<{ m: number; d: number; weekday: string } | null>(null);

  useEffect(() => {
    const now = new Date();
    const days = lang === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['일', '월', '화', '수', '목', '금', '토'];
    setToday({
      m: now.getMonth() + 1,
      d: now.getDate(),
      weekday: days[now.getDay()],
    });
  }, [lang]);

  return (
    <div
      style={{ background: C.paper, colorScheme: 'light' }}
      className="min-h-screen w-full relative overflow-hidden"
    >
      {/* 한지 노이즈 깔개 (다크 차단은 layout body level 에서 처리됨, phase-03) */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: HANJI_NOISE,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* keyframes — 배너 동심원·sparkle 미세 모션. globals.css 안 건드림 */}
      <style>{`
        @keyframes saju-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes saju-pulse {
          0%, 100% { transform: scale(1);    opacity: 1; }
          50%      { transform: scale(1.06); opacity: 0.92; }
        }
        @keyframes saju-twinkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.18); }
        }
      `}</style>

      <JsonLd data={faqSchema(LANDING_FAQ)} />

      <main
        id="main-content"
        className="mx-auto w-full max-w-[540px] lg:max-w-[1080px] pb-32 lg:pb-10 lg:px-6 relative"
        style={{ color: C.ink }}
      >
        {/* 배경 한자 — 페이지 우상단에 옅게, 사주방 결 */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute top-[60px] right-[-20px] lg:right-[40px] z-[1] leading-none"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 240,
            color: C.ink,
            opacity: 0.045,
          }}
        >
          運
        </div>
        <div
          aria-hidden
          className="pointer-events-none select-none absolute top-[420px] left-[-10px] lg:left-[40px] z-[1] leading-none"
          style={{
            fontFamily: SERIF,
            fontWeight: 900,
            fontSize: 180,
            color: C.ink,
            opacity: 0.035,
          }}
        >
          命
        </div>

        {/* Status bar (mini) — PC에서는 TopNav가 대체하므로 숨김 */}
        <div
          className="relative z-10 flex items-center justify-between px-5 pt-5 pb-1.5 text-[11.5px] lg:hidden"
          style={{ color: '#8C8579' }}
        >
          <div className="flex items-center gap-1.5 truncate">
            <span style={{ fontFamily: SERIF, fontWeight: 600, color: C.ink, opacity: 0.55 }}>占</span>
            <span className="truncate">{t('KASI 만세력 · 궁통보감 · 자평진전', 'KASI · classical texts')}</span>
          </div>
          {today && (
            <span
              className="shrink-0 tabular-nums tracking-tight"
              style={{ color: C.inkSoft, fontWeight: 600 }}
            >
              {today.m}.{today.d}
              <span style={{ color: '#C9C2B5', margin: '0 4px' }}>·</span>
              {today.weekday}
            </span>
          )}
        </div>

        {/* Title row — PC에서는 TopNav 브랜드가 대체 */}
        <header className="relative z-10 px-5 pt-3 pb-5 flex items-end justify-between lg:hidden">
          <div>
            <h1
              className="leading-none"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 36,
                color: C.ink,
                letterSpacing: '-0.01em',
              }}
            >
              운<span style={{ color: C.warmDeep }}>세</span>
            </h1>
            <p
              className="text-[12.5px] mt-2.5"
              style={{ color: '#8C8579', letterSpacing: '-0.005em' }}
            >
              {t('사주매칭 · 생년월일 하나로', 'SajuMatch · just one birth date')}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={t('검색', 'Search')}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-black/5 active:scale-95"
              style={{ color: C.ink }}
            >
              <Search size={19} strokeWidth={2.2} />
            </button>
          </div>
        </header>

        {/* Hero — 히어로 배너 */}
        <HeroBanner />

        {/* 기능 카드 그리드 — 캐러셀 아래 4열 2행 */}
        <section className="relative z-10 mt-6 px-3">
          <div className="mb-4 flex items-baseline gap-2 px-2">
            <span
              style={{
                fontFamily: SERIF,
                fontWeight: 700,
                color: C.warmDeep,
                opacity: 0.55,
                fontSize: 13,
                letterSpacing: '-0.02em',
              }}
            >
              ▎
            </span>
            <div>
              <p className="text-[12px] font-semibold tracking-tight" style={{ color: C.inkSub }}>
                {t('소름 돋는 미래 예측', 'Spookily accurate')}
              </p>
              <h3
                className="mt-1"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 20,
                  letterSpacing: '-0.02em',
                  color: C.ink,
                }}
              >
                {t('가장 정확한 사주 풀이', 'The most precise Saju reading')}
              </h3>
            </div>
          </div>
          <ul className="grid grid-cols-3 gap-3">
            {PRIMARY_GRID.map(({ href, ko, en, subKo, subEn, Icon, group, kanji }) => {
              const tt = TILE_TONE[href] ?? GROUP_TONE[group];
              return (
                <li key={href}>
                  <Link
                    href={localePath(href)}
                    className="relative flex flex-col justify-between p-4 rounded-2xl bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98] group h-[130px] overflow-hidden"
                  >
                    {/* 배경 한자 장식 */}
                    <span
                      aria-hidden
                      className="absolute bottom-[-8px] right-[-2px] pointer-events-none select-none leading-none"
                      style={{
                        fontFamily: SERIF,
                        fontWeight: 900,
                        fontSize: 64,
                        color: tt.fg,
                        opacity: 0.07,
                      }}
                    >
                      {kanji}
                    </span>
                    {/* 상단: 아이콘 + 화살표 */}
                    <div className="flex items-start justify-between">
                      <span
                        className="w-[38px] h-[38px] rounded-[12px] flex items-center justify-center"
                        style={{ background: tt.bg }}
                      >
                        <Icon size={19} strokeWidth={2.1} style={{ color: tt.fg }} />
                      </span>
                      <span className="text-gray-300 text-[13px]" aria-hidden>↗</span>
                    </div>
                    {/* 하단: 타이틀 + 설명 */}
                    <div className="relative z-[1]">
                      <h4
                        className="text-[13px] font-bold leading-tight tracking-tight"
                        style={{ color: C.ink }}
                      >
                        {t(ko, en)}
                      </h4>
                      <p className="mt-0.5 text-[10.5px] leading-relaxed text-gray-400 line-clamp-1">
                        {t(subKo, subEn)}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 하단 카드들 — PC에서 2컬럼 그리드 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-4 lg:mt-5">

        {/* Card: 오늘의 한 줄 */}
        <SectionCard
          eyebrow={today ? `${today.m}월 ${today.d}일` : t('오늘', 'Today')}
          title={t('오늘 하루의 흐름', "Today's flow")}
        >
          <Link
            href={localePath('/today')}
            className="flex items-center gap-4 rounded-2xl p-4 transition-transform active:scale-[0.99]"
            style={{ background: C.cream }}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: '#FFD8A0' }}
            >
              <Sun size={24} strokeWidth={2.2} style={{ color: '#8A5800' }} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14.5px] font-bold leading-tight tracking-tight" style={{ color: C.ink }}>
                {t('일진 한 줄로 보기', 'Read the day in a single line')}
              </p>
              <p className="text-[12.5px] mt-1" style={{ color: C.inkSoft }}>
                {t('재물·관계·건강 톤까지 3분 안에', 'Money · people · health in 3 minutes')}
              </p>
            </div>
            <span className="text-[20px] shrink-0" style={{ color: C.inkSub }} aria-hidden>›</span>
          </Link>
        </SectionCard>

        {/* Card: 둘의 인연 */}
        <SectionCard
          eyebrow={t('궁합 파헤치기', "Two of you")}
          title={t('우리는 어떻게 될까?', 'How will we turn out?')}
        >
          <div className="grid grid-cols-2 gap-3">
            <CoupleTile
              href={localePath('/compatibility')}
              title={t('이상형 역산', 'Ideal match')}
              sub={t('상대 없이 내게 맞는 사주', 'Your match, even without one')}
              tone={{ bg: C.rose, fg: C.roseDeep }}
              Icon={Heart}
            />
            <CoupleTile
              href={localePath('/couple')}
              title={t('커플 궁합', 'Couple match')}
              sub={t('두 사람의 점수와 흐름', 'Score and flow of two')}
              tone={{ bg: C.lilac, fg: C.lilacDeep }}
              Icon={Users}
            />
          </div>
        </SectionCard>

        {/* Card: 운세 이야기 */}
        <SectionCard
          eyebrow={t('운세 이야기', 'Fortune notes')}
          title={t('매일 새로 도착해요', 'Fresh every morning')}
        >
          <Link
            href={localePath('/blog')}
            className="flex items-center justify-between rounded-2xl p-4 transition-transform active:scale-[0.99]"
            style={{ background: C.mint }}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: C.mintDeep }}
              >
                <BookOpen size={20} strokeWidth={2.2} color="#FFFFFF" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-bold tracking-tight truncate" style={{ color: C.ink }}>
                  {t('블로그 보러 가기', 'Open the blog')}
                </p>
                <p className="text-[12px] mt-0.5 truncate" style={{ color: C.inkSoft }}>
                  {t('데일리 별자리·주간 사주·명리 노트', 'Daily horoscope · weekly Saju')}
                </p>
              </div>
            </div>
            <span className="text-[20px] shrink-0" style={{ color: C.inkSub }} aria-hidden>›</span>
          </Link>
        </SectionCard>
        </div>{/* /PC 2-col grid */}

        {/* Disclaimer */}
        <section className="px-5 pt-7 pb-2">
          <p className="text-[11px] leading-[1.65]" style={{ color: C.inkSub }}>
            {t(
              '이 사이트의 해석은 고전 명리학 문헌을 참고한 데이터 기반 콘텐츠로, 오락·참고 목적의 정보이며 어떠한 판단·결정의 근거로도 사용할 수 없습니다.',
              'Interpretations on this site are data-driven content based on classical Korean astrology literature. For entertainment and reference only.'
            )}
          </p>
        </section>
      </main>

      {/* Bottom Nav — fixed, 모바일 전용 (PC에서는 TopNav) */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
        style={{ background: C.paper }}
      >
        <div
          className="mx-auto w-full max-w-[540px]"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'saturate(180%) blur(14px)',
            WebkitBackdropFilter: 'saturate(180%) blur(14px)',
            borderTop: `1px solid ${C.line}`,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <nav className="flex items-center justify-around px-2 py-1.5">
            <BottomTab href={localePath('/')}             Icon={Home}        label={t('홈',     'Home')}   active />
            <BottomTab href={localePath('/today')}        Icon={Sun}         label={t('오늘',   'Today')}  />
            <BottomTab href={localePath('/saju')}         Icon={ScrollText}  label={t('사주',   'Saju')}   />
            <BottomTab href={localePath('/couple')}       Icon={Users}       label={t('궁합',   'Match')}  />
            <BottomTab href={localePath('/blog')}         Icon={BookOpen}    label={t('블로그', 'Blog')}   />
          </nav>
        </div>
      </div>
    </div>
  );
}

function SectionCard({
  eyebrow, title, children,
}: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section
      className="relative z-10 mt-3 mx-3 rounded-[24px] p-5 transition-shadow duration-300 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
      style={{ background: C.card, boxShadow: '0 1px 3px rgba(0,0,0,0.025)' }}
    >
      <div className="mb-4 flex items-baseline gap-2">
        <span
          style={{
            fontFamily: SERIF,
            fontWeight: 700,
            color: C.warmDeep,
            opacity: 0.55,
            fontSize: 13,
            letterSpacing: '-0.02em',
          }}
        >
          ▎
        </span>
        <div>
          <p className="text-[12px] font-semibold tracking-tight" style={{ color: C.inkSub }}>{eyebrow}</p>
          <h3
            className="mt-1"
            style={{
              fontFamily: SERIF,
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: '-0.02em',
              color: C.ink,
            }}
          >
            {title}
          </h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function CoupleTile({
  href, title, sub, tone, Icon,
}: { href: string; title: string; sub: string; tone: { bg: string; fg: string }; Icon: LucideIcon }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 rounded-2xl p-4 transition-transform active:scale-[0.98]"
      style={{ background: tone.bg }}
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ background: '#FFFFFF' }}
      >
        <Icon size={20} strokeWidth={2.2} style={{ color: tone.fg }} />
      </span>
      <div>
        <p className="text-[14px] font-bold leading-tight tracking-tight" style={{ color: C.ink }}>{title}</p>
        <p className="text-[11.5px] leading-snug mt-1" style={{ color: C.inkSoft }}>{sub}</p>
      </div>
    </Link>
  );
}

function BottomTab({
  href, Icon, label, active,
}: { href: string; Icon: LucideIcon; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-2 px-2 flex-1 transition-all hover:opacity-80 active:scale-95"
      style={{ color: active ? C.warmDeep : C.inkSub }}
    >
      <Icon size={21} strokeWidth={active ? 2.5 : 2} />
      <span className="text-[10.5px] font-bold tracking-tight">{label}</span>
    </Link>
  );
}


