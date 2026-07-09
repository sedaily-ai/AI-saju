'use client';

/**
 * BottomNav — 점신 결 고정 하단 5탭 (phase-04)
 *
 * - outer = 화면 전체 폭 paper bg (다크 노출 차단)
 * - inner = max-w-540 흰 dock (blur)
 * - 5탭: 홈 · 오늘 · 사주 · 궁합 · 블로그
 * - active prop 으로 현재 탭 강조
 */

import Link from 'next/link';
import {
  Home, Sun, ScrollText, Users, BookOpen,
  type LucideIcon,
} from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';
import { SAJU } from './sajuTokens';

export type BottomNavKey = 'home' | 'today' | 'saju' | 'couple' | 'blog';

interface BottomNavProps {
  active?: BottomNavKey;
  /** 컨테이너 폭 (default 540, PageShell 과 동일) */
  maxWidth?: number;
}

export function BottomNav({ active, maxWidth = 540 }: BottomNavProps) {
  const { t, localePath } = useLang();

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 lg:hidden"
      style={{ background: SAJU.paper }}
    >
      <div
        className="mx-auto w-full"
        style={{
          maxWidth,
          background: 'rgba(255,255,255,0.96)',
          backdropFilter: 'saturate(180%) blur(14px)',
          WebkitBackdropFilter: 'saturate(180%) blur(14px)',
          borderTop: `1px solid ${SAJU.line}`,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <nav className="flex items-center justify-around px-2 py-1.5">
          <Tab href={localePath('/')}       icon={Home}       label={t('홈',     'Home')}  isActive={active === 'home'} />
          <Tab href={localePath('/today')}  icon={Sun}        label={t('오늘',   'Today')} isActive={active === 'today'} />
          <Tab href={localePath('/saju')}   icon={ScrollText} label={t('사주',   'Saju')}  isActive={active === 'saju'} />
          <Tab href={localePath('/couple')} icon={Users}      label={t('궁합',   'Match')} isActive={active === 'couple'} />
          <Tab href={localePath('/blog')}   icon={BookOpen}   label={t('블로그', 'Blog')}  isActive={active === 'blog'} />
        </nav>
      </div>
    </div>
  );
}

function Tab({
  href, icon: Icon, label, isActive,
}: { href: string; icon: LucideIcon; label: string; isActive?: boolean }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 py-2 px-2 flex-1 transition-all hover:opacity-80 active:scale-95"
      style={{ color: isActive ? SAJU.warmDeep : SAJU.inkSub }}
    >
      <Icon size={21} strokeWidth={isActive ? 2.5 : 2} />
      <span className="text-[10.5px] font-bold tracking-tight">{label}</span>
    </Link>
  );
}
