'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * 모든 페이지 좌상단 fixed 홈 버튼.
 * - 랜딩(`/`, `/en`) 에서는 숨김
 * - 클릭 시 무조건 루트(`/`)로 이동
 * - 우상단 토글바와 동일 톤(글래스모피즘 칩) 으로 통일
 */
export function BackButton() {
  const pathname = usePathname();

  const isLanding = pathname === '/' || pathname === '/en' || pathname === '/en/';
  if (isLanding) return null;

  return (
    <Link
      href="/"
      aria-label="홈으로"
      className="fixed top-3 left-3 sm:top-4 sm:left-4 z-50 inline-flex items-center justify-center rounded-full transition-transform hover:-translate-x-0.5"
      style={{
        width: 40,
        height: 40,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: '0 6px 18px -8px rgba(17,17,17,0.18)',
        border: '1px solid rgba(17,17,17,0.06)',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#111"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </Link>
  );
}
