'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';

interface Slide {
  eyebrowKo: string; eyebrowEn: string;
  titleKo: string; titleEn: string;
  subKo: string; subEn: string;
  ctaKo: string; ctaEn: string;
  href: string;
  visual: 'character' | 'match';
  tone: { gradient: string; accent: string; accentLight: string; visualBg: string; visualBorder: string };
}

const SLIDES: Slide[] = [
  {
    eyebrowKo: '공개 프리뷰', eyebrowEn: 'Public Preview',
    titleKo: '나는 60개 중\n어떤 캐릭터일까?', titleEn: 'Which of 60\ncharacters am I?',
    subKo: '생년월일 하나로 내 사주 원국과 캐릭터를 확인해요.', subEn: 'One birth date reveals your chart and your character.',
    ctaKo: '내 사주 보기', ctaEn: 'See my saju',
    href: '/saju/chart',
    visual: 'character',
    tone: { gradient: 'linear-gradient(to bottom, #ECFDF5 0%, #FFFFFF 100%)', accent: '#059669', accentLight: '#D1FAE5', visualBg: 'linear-gradient(135deg, #F0FDF9 0%, #E6F7F2 100%)', visualBorder: '#D1FAE5' },
  },
  {
    eyebrowKo: '이상형 역산', eyebrowEn: 'Ideal Match',
    titleKo: '나는 누구와\n잘 맞을까?', titleEn: 'Who am I\nreally compatible with?',
    subKo: '상대 없이도, 내 사주로 맞는 인연을 역산해드려요.', subEn: "No partner needed — we reverse-engineer your match from your chart.",
    ctaKo: '이상형 보기', ctaEn: 'Find my match',
    href: '/compatibility',
    visual: 'match',
    tone: { gradient: 'linear-gradient(to bottom, #FFF1F0 0%, #FFFFFF 100%)', accent: '#E11D48', accentLight: '#FECDD3', visualBg: 'linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)', visualBorder: '#FECDD3' },
  },
];

/**
 * HeroBanner — 랜딩 페이지 상단 히어로 섹션 (자동 슬라이드 2종)
 * 왼쪽: 텍스트 + CTA 버튼, 오른쪽: 슬라이드별 비주얼
 */
export function HeroBanner() {
  const { t, localePath } = useLang();
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIdx(i => (i + 1) % SLIDES.length), 5000);
    return () => clearInterval(id);
  }, []);

  const slide = SLIDES[idx];
  const go = (dir: -1 | 1) => setIdx(i => (i + dir + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative z-10 px-3 mt-6">
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:gap-8 p-6 lg:p-10" style={{ background: slide.tone.gradient }}>
        {/* 좌우 이동 화살표 */}
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label={t('이전 슬라이드', 'Previous slide')}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/80 shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-90"
        >
          <ChevronLeft size={18} strokeWidth={2.4} style={{ color: slide.tone.accent }} />
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label={t('다음 슬라이드', 'Next slide')}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-white/80 shadow-sm transition-all hover:bg-white hover:shadow-md active:scale-90"
        >
          <ChevronRight size={18} strokeWidth={2.4} style={{ color: slide.tone.accent }} />
        </button>

        {/* 좌: 텍스트 + CTA */}
        <div className="flex-1 min-w-0">
          {/* 프리뷰 라벨 */}
          <span className="inline-block text-[13px] font-bold tracking-tight mb-3" style={{ color: slide.tone.accent }}>
            {t(slide.eyebrowKo, slide.eyebrowEn)}
          </span>

          {/* 메인 타이틀 */}
          <h2 className="text-[32px] lg:text-[40px] font-black leading-[1.25] tracking-[-0.02em] text-gray-900 whitespace-pre-line">
            {t(slide.titleKo, slide.titleEn)}
          </h2>

          {/* 서브 텍스트 */}
          <p className="mt-4 text-[14px] lg:text-[15px] leading-relaxed text-gray-500">
            {t(slide.subKo, slide.subEn)}
          </p>

          {/* CTA 버튼 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={localePath(slide.href)}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
              style={{ background: slide.tone.accent }}
            >
              {t(slide.ctaKo, slide.ctaEn)}
            </Link>
          </div>

          {/* 슬라이드 인디케이터 */}
          <div className="mt-6 flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                aria-label={`${t('슬라이드', 'Slide')} ${i + 1}`}
                className="block h-1.5 rounded-full transition-all"
                style={{ width: i === idx ? 20 : 8, background: i === idx ? slide.tone.accent : slide.tone.accentLight }}
              />
            ))}
          </div>
        </div>

        {/* 우: 슬라이드별 비주얼 */}
        <div className="mt-8 lg:mt-0 flex-shrink-0 flex items-center justify-center">
          <div
            className="relative w-[220px] h-[220px] lg:w-[280px] lg:h-[280px] rounded-[24px] overflow-hidden flex items-center justify-center"
            style={{
              background: slide.tone.visualBg,
              border: `3px solid ${slide.tone.visualBorder}`,
            }}
          >
            {slide.visual === 'character' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/saju_mascot.png"
                alt={t('나의 사주 캐릭터', 'My saju character')}
                className="w-[85%] h-[85%] object-contain"
              />
            ) : (
              <Heart size={96} strokeWidth={1.6} style={{ color: slide.tone.accent }} fill={slide.tone.accentLight} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
