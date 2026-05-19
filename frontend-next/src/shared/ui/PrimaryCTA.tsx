'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { FluentEmoji, type FluentEmojiName } from './FluentEmoji';

/**
 * Wrtn Flot 톤의 메인 CTA 버튼.
 * - 보라→핑크 그라데이션 + 보라톤 그림자
 * - 좌측 옵션 아이콘(Fluent Emoji 3D)
 * - 우측 화살표 칩 (호버 시 살짝 슬라이드)
 */
type Size = 'md' | 'lg';

interface BaseProps {
  children: ReactNode;
  /** 좌측에 노출할 Fluent Emoji 키. 미지정 시 아이콘 없음. */
  icon?: FluentEmojiName;
  size?: Size;
  className?: string;
}

interface AsLinkProps extends BaseProps {
  href: string;
  onClick?: never;
  type?: never;
}

interface AsButtonProps extends BaseProps {
  href?: undefined;
  onClick?: () => void;
  type?: 'button' | 'submit';
}

type Props = AsLinkProps | AsButtonProps;

const SIZE: Record<Size, { h: string; pl: string; pr: string; text: string; iconSize: number; chipSize: string }> = {
  md: { h: 'h-12', pl: 'pl-5', pr: 'pr-4', text: 'text-[14px]', iconSize: 18, chipSize: 'w-6 h-6' },
  lg: { h: 'h-14', pl: 'pl-6', pr: 'pr-5', text: 'text-[15px]', iconSize: 20, chipSize: 'w-7 h-7' },
};

const baseStyle = {
  background: 'linear-gradient(135deg, #7C5CFF 0%, #FF4D8A 100%)',
  color: '#FFFFFF',
  boxShadow: '0 12px 28px -10px rgba(124, 92, 255, 0.55)',
};

export function PrimaryCTA(props: Props) {
  const { children, icon, size = 'lg', className = '' } = props;
  const s = SIZE[size];

  const inner = (
    <>
      {icon && <FluentEmoji name={icon} size={s.iconSize} alt="" />}
      <span>{children}</span>
      <span
        aria-hidden
        className={`ml-1 inline-flex items-center justify-center rounded-full transition-transform group-hover:translate-x-0.5 ${s.chipSize}`}
        style={{ background: 'rgba(255,255,255,0.22)' }}
      >
        →
      </span>
    </>
  );

  const cls = `group inline-flex items-center justify-center gap-2 ${s.pl} ${s.pr} ${s.h} rounded-full ${s.text} font-extrabold no-underline transition-transform hover:-translate-y-0.5 cursor-pointer border-none ${className}`;

  if ('href' in props && props.href) {
    return (
      <Link href={props.href} className={cls} style={baseStyle}>
        {inner}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      className={cls}
      style={baseStyle}
    >
      {inner}
    </button>
  );
}
