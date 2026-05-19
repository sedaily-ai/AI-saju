'use client';

import type { ReactNode } from 'react';
import { FluentEmoji, type FluentEmojiName } from './FluentEmoji';

/**
 * Wrtn Flot 톤의 페이지 히어로 카드.
 *
 * - 보라→핑크 그라데이션이 기본 (variant='primary')
 * - 우측 하단에 Fluent Emoji 3D 가 살짝 잘려 들어가는 워터마크
 * - 위에 작은 eyebrow 라벨, 큰 헤딩, 짧은 서브카피, 자식(children) 슬롯(보통 CTA/메타)
 *
 * variant='soft' 는 파스텔 단색 배경(예: PASTEL.lilac) 을 받는 용도.
 */
type Variant = 'primary' | 'soft';

interface Props {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** 우측 하단 워터마크 일러스트 */
  illustration?: FluentEmojiName;
  /** 슬롯 — 보통 PrimaryCTA 등 액션 영역 */
  children?: ReactNode;
  variant?: Variant;
  /** soft 모드에서 카드 배경색 (기본 #FAFAFA) */
  softBg?: string;
  /** primary 모드의 그라데이션 직접 지정 */
  gradient?: string;
  className?: string;
}

const PRIMARY_GRADIENT = 'linear-gradient(135deg, #7C5CFF 0%, #FF4D8A 100%)';

export function PageHero({
  eyebrow,
  title,
  subtitle,
  illustration,
  children,
  variant = 'primary',
  softBg = '#FAFAFA',
  gradient,
  className = '',
}: Props) {
  const isPrimary = variant === 'primary';
  const bg = isPrimary ? (gradient ?? PRIMARY_GRADIENT) : softBg;
  const ink = isPrimary ? '#FFFFFF' : '#111111';
  const sub = isPrimary ? 'rgba(255,255,255,0.85)' : '#3F3F46';
  const eyebrowColor = isPrimary ? 'rgba(255,255,255,0.85)' : '#6B7280';

  return (
    <section
      className={`relative overflow-hidden rounded-[24px] px-6 py-7 ${className}`}
      style={{ background: bg, color: ink }}
    >
      {illustration && (
        <div
          aria-hidden
          className="absolute pointer-events-none select-none"
          style={{ right: -6, bottom: -6 }}
        >
          <FluentEmoji name={illustration} size={140} alt="" className="opacity-90" />
        </div>
      )}
      <div className="relative">
        {eyebrow && (
          <div
            className="text-[10.5px] font-bold tracking-[0.18em] uppercase mb-1.5"
            style={{ color: eyebrowColor }}
          >
            {eyebrow}
          </div>
        )}
        <h2 className="text-[20px] sm:text-[22px] font-extrabold leading-[1.25] tracking-[-0.02em] mb-2 whitespace-pre-line">
          {title}
        </h2>
        {subtitle && (
          <p
            className="text-[12.5px] leading-[1.6] mb-4 max-w-[320px]"
            style={{ color: sub }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
