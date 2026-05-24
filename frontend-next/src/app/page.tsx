'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  ScrollText, Sun, Coins, Briefcase, Heart, Users, Rabbit, Newspaper,
  Search, Sparkles, BookOpen, Home, Moon, Star,
  type LucideIcon,
} from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';
import { JsonLd, faqSchema } from '@/shared/lib/jsonLd';

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
  paper: '#FAF6F0',     // 페이지 배경 (약간 따뜻한 오프화이트)
  card: '#FFFFFF',
  ink: '#1A1A1A',
  inkSub: '#A0A0A8',
  inkSoft: '#4F4F58',
  line: '#EFEAE3',
  warm: '#FF8A4C',
  warmSoft: '#FFE9D6',
  warmDeep: '#D9651E',
  cream: '#FFF6E8',
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
  Icon: LucideIcon;
  group: 'core' | 'wealth' | 'love' | 'info';
};

// 4톤 그룹화 — 사탕색 8색 폐기
const PRIMARY_GRID: Tile[] = [
  { href: '/saju',          ko: '내 사주',     en: 'My Saju',         Icon: ScrollText, group: 'core'   },
  { href: '/today',         ko: '오늘 운세',   en: "Today",           Icon: Sun,        group: 'core'   },
  { href: '/zodiac',        ko: '띠별 운세',   en: 'Zodiac',          Icon: Rabbit,     group: 'core'   },
  { href: '/chaeun',        ko: '재운',        en: 'Wealth',          Icon: Coins,      group: 'wealth' },
  { href: '/career',        ko: '커리어',      en: 'Career',          Icon: Briefcase,  group: 'wealth' },
  { href: '/compatibility', ko: '이상형',      en: 'Ideal',           Icon: Heart,      group: 'love'   },
  { href: '/couple',        ko: '커플 궁합',   en: 'Couple',          Icon: Users,      group: 'love'   },
  { href: '/news',          ko: '경제 뉴스',   en: 'News',            Icon: Newspaper,  group: 'info'   },
];

const GROUP_TONE: Record<Tile['group'], { bg: string; fg: string }> = {
  core:   { bg: C.warmSoft, fg: C.warmDeep   },
  wealth: { bg: C.cream,    fg: '#9A6B0F'    },
  love:   { bg: C.rose,     fg: C.roseDeep   },
  info:   { bg: C.lilac,    fg: C.lilacDeep  },
};

const BANNERS = [
  {
    eyebrowKo: '공개 프리뷰',
    eyebrowEn: 'Open Preview',
    titleKo: '오늘의 일진,\n한 줄로 받기',
    titleEn: "Today's reading\nin a single line",
    subKo: '생년월일 하나면 끝. 회원가입도 필요 없어요.',
    subEn: 'One birth date. No sign-up.',
    href: '/today',
    accent: 'warm' as const,
  },
  {
    eyebrowKo: '데이터 명리학',
    eyebrowEn: 'Data Saju',
    titleKo: '근거가 보이는\n사주 해석',
    titleEn: 'Saju with the\nsources attached',
    subKo: 'KASI 만세력 + 궁통보감·삼명통회·자평진전.',
    subEn: 'KASI calendar + 3 classical texts.',
    href: '/saju',
    accent: 'lilac' as const,
  },
  {
    eyebrowKo: '커플',
    eyebrowEn: 'Couple',
    titleKo: '둘의 인연을\n점수로',
    titleEn: 'Two of you,\nscored',
    subKo: '천간합·지지합·오행 보완을 합산해서 보여드려요.',
    subEn: 'Sum of stem · branch · element bridges.',
    href: '/couple',
    accent: 'rose' as const,
  },
];

const BANNER_ACCENTS: Record<'warm' | 'lilac' | 'rose', { bg: string; chip: string; orb: string; orbSoft: string }> = {
  warm:  { bg: C.warmSoft, chip: C.warmDeep,  orb: C.warm,      orbSoft: '#FFC195' },
  lilac: { bg: C.lilac,    chip: C.lilacDeep, orb: C.lilacDeep, orbSoft: '#B7A2EE' },
  rose:  { bg: C.rose,     chip: C.roseDeep,  orb: C.roseDeep,  orbSoft: '#F3A296' },
};

export default function LandingPage() {
  const { t, lang, localePath } = useLang();
  const [bannerIdx, setBannerIdx] = useState(0);
  const [today, setToday] = useState<{ m: number; d: number; weekday: string } | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setBannerIdx((i) => (i + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

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

  const banner = BANNERS[bannerIdx];
  const accent = BANNER_ACCENTS[banner.accent];

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
        className="mx-auto w-full max-w-[540px] pb-32 relative"
        style={{ color: C.ink }}
      >
        {/* 배경 한자 — 페이지 우상단에 옅게, 사주방 결 */}
        <div
          aria-hidden
          className="pointer-events-none select-none absolute top-[60px] right-[-20px] z-0 leading-none"
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
          className="pointer-events-none select-none absolute top-[420px] left-[-10px] z-0 leading-none"
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

        {/* Status bar (mini) — 살짝 진하게, 점·점 구분자 정돈 */}
        <div
          className="relative z-10 flex items-center justify-between px-5 pt-5 pb-1.5 text-[11.5px]"
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

        {/* Title row */}
        <header className="relative z-10 px-5 pt-3 pb-5 flex items-end justify-between">
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
            <InlineLangToggle />
          </div>
        </header>

        {/* Hero banner — auto-rotating */}
        <section className="relative z-10 px-5">
          <Link
            href={localePath(banner.href)}
            className="block relative overflow-hidden rounded-[28px] p-6 pt-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] active:scale-[0.99]"
            style={{ background: accent.bg, minHeight: 248 }}
          >
            <span
              className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[11.5px] font-bold"
              style={{ background: accent.chip, color: '#FFFFFF' }}
            >
              {t(banner.eyebrowKo, banner.eyebrowEn)}
              <span aria-hidden> ›</span>
            </span>
            <h2
              className="mt-5 text-[26px] leading-[1.18] font-black tracking-[-0.02em] whitespace-pre-line"
              style={{ color: C.ink }}
            >
              {t(banner.titleKo, banner.titleEn)}
            </h2>
            <p
              className="mt-3 text-[13.5px] leading-[1.5] max-w-[280px]"
              style={{ color: C.inkSoft }}
            >
              {t(banner.subKo, banner.subEn)}
            </p>

            {/* 그래픽 자리 — 추상 동심원 + sparkle + 배경 한자 (마스코트 대체) */}
            <div
              className="absolute right-[-30px] bottom-[-30px] w-[200px] h-[200px] pointer-events-none"
              aria-hidden
            >
              {/* 배경 한자 — 동심원과 겹쳐서 사주방 결 */}
              <span
                className="absolute right-[30px] bottom-[60px] leading-none"
                style={{
                  fontFamily: SERIF,
                  fontWeight: 900,
                  fontSize: 140,
                  color: '#FFFFFF',
                  opacity: 0.35,
                  letterSpacing: '-0.05em',
                }}
              >
                占
              </span>
              {/* 큰 반투명 링 — 천천히 회전 */}
              <div
                className="absolute right-0 bottom-0 w-[200px] h-[200px] rounded-full animate-[saju-spin_22s_linear_infinite]"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${accent.orbSoft}, transparent 70%)`,
                  opacity: 0.5,
                }}
              />
              {/* 중간 링 */}
              <div
                className="absolute right-[20px] bottom-[20px] w-[140px] h-[140px] rounded-full"
                style={{ background: accent.orbSoft, opacity: 0.55 }}
              />
              {/* 솔리드 작은 원 — pulse */}
              <div
                className="absolute right-[44px] bottom-[44px] w-[88px] h-[88px] rounded-full animate-[saju-pulse_3.6s_ease-in-out_infinite]"
                style={{ background: accent.orb }}
              />
              {/* sparkle */}
              <Sparkles size={22} className="absolute top-[18px] right-[78px] animate-[saju-twinkle_2.4s_ease-in-out_infinite]" style={{ color: accent.orb }} />
              <Star size={12} className="absolute top-[58px] right-[160px]" style={{ color: accent.orb, opacity: 0.7 }} />
              <Star size={14} className="absolute bottom-[148px] right-[24px] animate-[saju-twinkle_3.2s_ease-in-out_infinite]" style={{ color: '#FFFFFF', opacity: 0.95 }} fill="#FFFFFF" />
              <Moon size={18} className="absolute bottom-[112px] right-[60px]" style={{ color: '#FFFFFF', opacity: 0.9 }} />
            </div>

            {/* dots — 활성은 배너 accent 색으로 톤 매칭 */}
            <div className="absolute left-6 bottom-5 flex gap-1.5">
              {BANNERS.map((_, i) => (
                <span
                  key={i}
                  className="block h-1.5 rounded-full transition-all"
                  style={{
                    width: i === bannerIdx ? 20 : 6,
                    background: i === bannerIdx ? accent.orb : 'rgba(26,26,26,0.18)',
                  }}
                />
              ))}
            </div>
          </Link>
        </section>

        {/* Card: 가장 정확한 사주 풀이 */}
        <SectionCard
          eyebrow={t('소름 돋는 미래 예측', 'Spookily accurate')}
          title={t('가장 정확한 사주 풀이', 'The most precise Saju reading')}
        >
          <ul className="grid grid-cols-4 gap-y-6 gap-x-1 pt-1">
            {PRIMARY_GRID.map(({ href, ko, en, Icon, group }) => {
              const tt = GROUP_TONE[group];
              return (
                <li key={href}>
                  <Link
                    href={localePath(href)}
                    className="flex flex-col items-center gap-2.5 group"
                  >
                    <span
                      className="w-[56px] h-[56px] rounded-[18px] flex items-center justify-center transition-all duration-200 group-hover:-translate-y-0.5 group-hover:brightness-95 group-active:scale-95"
                      style={{ background: tt.bg }}
                    >
                      <Icon size={26} strokeWidth={2.1} style={{ color: tt.fg }} className="transition-transform group-hover:scale-110" />
                    </span>
                    <span
                      className="text-[12.5px] font-semibold text-center leading-tight tracking-tight"
                      style={{ color: C.ink }}
                    >
                      {t(ko, en)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </SectionCard>

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

      {/* Bottom Nav — fixed, outer = 페이지 배경 (다크모드 노출 차단), inner = 540 흰 dock */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40"
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

// 페이지 톤(페이퍼·워밍)에 맞춘 자체 KO/EN 토글 — shared LangToggle 무수정
function InlineLangToggle() {
  const { lang, setLang } = useLang();
  const isEn = lang === 'en';
  return (
    <button
      type="button"
      onClick={() => setLang(isEn ? 'ko' : 'en')}
      aria-label={isEn ? '한국어로 전환' : 'Switch to English'}
      title={isEn ? '한국어' : 'English'}
      className="relative inline-flex items-center rounded-full transition-colors hover:brightness-95"
      style={{
        width: 60,
        height: 30,
        padding: 3,
        background: '#F0E9DC',
        border: '1px solid #E5DCC8',
      }}
    >
      <span
        aria-hidden
        className="absolute rounded-full transition-transform duration-300 ease-out"
        style={{
          width: 26,
          height: 22,
          top: 3,
          left: 3,
          background: C.warmDeep,
          transform: isEn ? 'translateX(28px)' : 'translateX(0)',
          boxShadow: '0 1px 2px rgba(217,101,30,0.25)',
        }}
      />
      <span
        className="relative z-10 flex items-center justify-center text-[10px] font-extrabold tracking-tight transition-colors"
        style={{ width: 26, height: 22, color: isEn ? C.inkSoft : '#FFFFFF' }}
      >
        KO
      </span>
      <span
        className="relative z-10 flex items-center justify-center text-[10px] font-extrabold tracking-tight transition-colors"
        style={{ width: 26, height: 22, color: isEn ? '#FFFFFF' : C.inkSoft }}
      >
        EN
      </span>
    </button>
  );
}
