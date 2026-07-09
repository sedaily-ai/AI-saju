'use client';

import Link from 'next/link';
import { useLang } from '@/shared/lib/LangContext';

/**
 * HeroBanner — 랜딩 페이지 상단 히어로 섹션
 * 왼쪽: 텍스트 + CTA 버튼, 오른쪽: 띠별 동물 일러스트 카드
 */
export function HeroBanner() {
  const { t, localePath } = useLang();

  return (
    <section className="relative z-10 px-3 mt-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8 p-6 lg:p-10" style={{ background: 'linear-gradient(to bottom, #ECFDF5 0%, #FFFFFF 100%)' }}>
        {/* 좌: 텍스트 + CTA */}
        <div className="flex-1 min-w-0">
          {/* 프리뷰 라벨 */}
          <span className="inline-block text-[13px] font-bold tracking-tight text-[#059669] mb-3">
            {t('공개 프리뷰', 'Public Preview')}
          </span>

          {/* 메인 타이틀 */}
          <h2 className="text-[32px] lg:text-[40px] font-black leading-[1.25] tracking-[-0.02em] text-gray-900">
            {t('오늘의 일진,', "Today's fortune,")}
            <br />
            {t('한 줄로 받기', 'in one line')}
          </h2>

          {/* 서브 텍스트 */}
          <p className="mt-4 text-[14px] lg:text-[15px] leading-relaxed text-gray-500">
            {t(
              '생년월일 하나면 끝. 회원가입도 필요 없어요.',
              'Just your birthdate. No sign-up needed.'
            )}
            <br />
            {t(
              '정통 만세력 기반, 오늘 하루의 핵심 기운만 담백하게.',
              'Based on traditional almanac, only the essence of today.'
            )}
          </p>

          {/* CTA 버튼 */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={localePath('/today')}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-[0.97]"
              style={{ background: '#059669' }}
            >
              {t('내 일진 확인하기', 'Check my fortune')}
            </Link>
            <Link
              href={localePath('/jeomsin')}
              className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-[14px] font-bold text-gray-700 border border-gray-300 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97]"
            >
              {t('주역점 카드 뽑기', 'Draw I Ching card')}
            </Link>
          </div>
        </div>

        {/* 우: 동물 일러스트 카드 */}
        <div className="mt-8 lg:mt-0 flex-shrink-0 flex items-center justify-center">
          <div
            className="relative w-[220px] h-[220px] lg:w-[280px] lg:h-[280px] rounded-[24px] overflow-hidden flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #F0FDF9 0%, #E6F7F2 100%)',
              border: '3px solid #D1FAE5',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/saju_mascot.png"
              alt={t('오늘의 띠 동물', "Today's zodiac animal")}
              className="w-[85%] h-[85%] object-contain"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
