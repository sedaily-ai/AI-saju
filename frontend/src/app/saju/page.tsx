'use client';

import Link from 'next/link';
import { Sun, Coins, Briefcase, Heart, Users, ScrollText, Sparkles, type LucideIcon } from 'lucide-react';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { SAJU } from '@/shared/ui/sajuTokens';
import { useLang } from '@/shared/lib/LangContext';

type Category = { href: string; ko: string; en: string; Icon: LucideIcon; tone: { bg: string; fg: string } };

const CATEGORIES: Category[] = [
  { href: '/today',         ko: '오늘',       en: 'Today',    Icon: Sun,        tone: { bg: '#FFF6E8', fg: '#B8791A' } },
  { href: '/chaeun',        ko: '재운',       en: 'Wealth',   Icon: Coins,      tone: { bg: '#FFF8E1', fg: '#9A6B0F' } },
  { href: '/career',        ko: '커리어',     en: 'Career',   Icon: Briefcase,  tone: { bg: '#ECFDF5', fg: '#059669' } },
  { href: '/compatibility', ko: '이상형',     en: 'Ideal',    Icon: Heart,      tone: { bg: '#FFF1F0', fg: '#D9756B' } },
  { href: '/couple',        ko: '궁합',       en: 'Couple',   Icon: Users,      tone: { bg: '#F3EEFF', fg: '#7A5BE0' } },
  { href: '/jeomsin',       ko: '주역점',     en: 'I Ching',  Icon: Sparkles,   tone: { bg: '#F3EEFF', fg: '#7A5BE0' } },
  { href: '/saju/chart',    ko: '내 사주 원국', en: 'My Chart', Icon: ScrollText, tone: { bg: '#EFF6FF', fg: '#1D4ED8' } },
];

export default function SajuStandalonePage() {
  const { t, localePath } = useLang();

  return (
    <PageShell hanjaRight="易" hanjaLeft="命">
      <PageHeader
        title={t('내 사주', 'My Saju')}
        titleAccent={t('주', 'Saju')}
        sub={t(
          '궁통보감·삼명통회·자평진전 3대 고전 · KASI 만세력',
          '3 classical texts · KASI ephemeris',
        )}
      />

      {/* 사주 하위 카테고리 메뉴 — 오늘/재운/커리어/이상형/궁합/내 사주 원국 (2026-07-09) */}
      <div className="relative z-10 px-3 mt-3">
        <ul className="grid grid-cols-3 gap-2.5">
          {CATEGORIES.map(({ href, ko, en, Icon, tone }) => (
            <li key={href}>
              <Link
                href={localePath(href)}
                className="w-full flex flex-col items-center rounded-[18px] bg-white py-4 transition-all hover:-translate-y-0.5 active:scale-[0.97]"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-1.5"
                  style={{ background: `linear-gradient(135deg, ${tone.bg} 0%, #FFFFFF 100%)`, color: tone.fg }}
                >
                  <Icon size={19} strokeWidth={2.1} />
                </div>
                <span className="text-[11.5px] font-bold" style={{ color: SAJU.ink }}>
                  {t(ko, en)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* 미리보기 티저 — "내 사주 원국"으로 이동시키는 블러 예시 + CTA */}
      <div className="relative z-10 px-3 mt-3">
        <Link
          href={localePath('/saju/chart')}
          className="relative overflow-hidden rounded-[20px] bg-white p-5 block transition-all hover:-translate-y-0.5"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div aria-hidden className="pointer-events-none select-none" style={{ filter: 'blur(5px)', opacity: 0.6 }}>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { hanja: '癸', bg: '#111827' },
                { hanja: '乙', bg: '#059669' },
                { hanja: '己', bg: '#D4A72C' },
                { hanja: '—', bg: '#E5E7EB' },
              ].map((p, i) => (
                <div key={i} className="rounded-xl py-4 flex items-center justify-center text-[18px] font-black text-white" style={{ background: p.bg }}>
                  {p.hanja}
                </div>
              ))}
            </div>
            <div className="h-3 w-2/3 rounded-full bg-gray-200 mb-2" />
            <div className="h-3 w-1/2 rounded-full bg-gray-200" />
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/50">
            <p className="text-[13px] font-bold text-center px-6" style={{ color: SAJU.ink }}>
              {t('원국·십성·대운까지, 내 사주를 한 장으로', 'Your chart, ten gods, and luck cycle in one card')}
            </p>
            <span
              className="rounded-full px-5 py-2.5 text-[13px] font-bold text-white transition-all"
              style={{ background: SAJU.warmDeep }}
            >
              {t('내 사주 원국 보기', 'See my chart')}
            </span>
          </div>
        </Link>
      </div>

      <BottomNav active="saju" />
    </PageShell>
  );
}
