'use client';

/**
 * PageShell — 점신 결 페이지 외곽 래퍼 (phase-04, 2026-05-24)
 *
 * - paper bg (다크모드 차단은 layout body level)
 * - 한지 노이즈 fixed layer
 * - 우상단 大 한자 + 좌중단 中 한자 (옅게)
 * - max-w-540 가운데 정렬 컨테이너
 * - 키프레임 inject (saju-spin/pulse/twinkle)
 *
 * 사용:
 *   <PageShell hanjaRight="運" hanjaLeft="命">
 *     <PageHeader ... />
 *     <SectionCard>...</SectionCard>
 *     <BottomNav active="saju" />
 *   </PageShell>
 */

import type { ReactNode } from 'react';
import { HANJI_NOISE, SAJU, SAJU_KEYFRAMES, SERIF } from './sajuTokens';

interface PageShellProps {
  children: ReactNode;
  /** 우상단 큰 한자 배경 (default "運") */
  hanjaRight?: string;
  /** 좌중단 작은 한자 배경 (default "命") */
  hanjaLeft?: string;
  /** 한자 배경 표시 여부 (default true) */
  showHanjaBg?: boolean;
  /** 컨테이너 최대 폭 (default 540) */
  maxWidth?: number;
  /** 하단 바텀 내비 공간 확보용 padding (default 32 = pb-32) */
  bottomPadding?: number;
}

export function PageShell({
  children,
  hanjaRight = '運',
  hanjaLeft = '命',
  showHanjaBg = true,
  maxWidth = 540,
  bottomPadding = 32,
}: PageShellProps) {
  return (
    <div
      style={{ background: SAJU.paper, colorScheme: 'light' }}
      className="min-h-screen w-full relative overflow-hidden"
    >
      {/* 한지 노이즈 깔개 */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: HANJI_NOISE,
          backgroundRepeat: 'repeat',
        }}
      />

      {/* 키프레임 inject (전역 1회) */}
      <style>{SAJU_KEYFRAMES}</style>

      <main
        className="mx-auto w-full relative"
        style={{
          maxWidth,
          paddingBottom: bottomPadding * 4, // tailwind pb 단위(4)로 환산
          color: SAJU.ink,
        }}
      >
        {showHanjaBg && (
          <>
            <div
              aria-hidden
              className="pointer-events-none select-none absolute top-[60px] right-[-20px] z-0 leading-none"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 240,
                color: SAJU.ink,
                opacity: 0.045,
              }}
            >
              {hanjaRight}
            </div>
            <div
              aria-hidden
              className="pointer-events-none select-none absolute top-[420px] left-[-10px] z-0 leading-none"
              style={{
                fontFamily: SERIF,
                fontWeight: 900,
                fontSize: 180,
                color: SAJU.ink,
                opacity: 0.035,
              }}
            >
              {hanjaLeft}
            </div>
          </>
        )}

        {children}
      </main>
    </div>
  );
}
