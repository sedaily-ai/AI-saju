'use client';

import { useMemo } from 'react';
import { useLang } from '@/shared/lib/LangContext';
import type { Pillar } from '@/features/fortune/lib/engine';
import { computeAvoidance } from '../lib/avoidanceEngine';
import { ToggleSection } from '@/features/ideal-match/components/ToggleSection';
import type { AvoidReasonCode } from '../types';

/** 오행 — 영문 라벨 */
const OH_EN: Record<string, string> = {
  '목': 'Wood', '화': 'Fire', '토': 'Earth', '금': 'Metal', '수': 'Water',
};
/** 12지지 → 서양 띠 */
const ZODIAC_EN: Record<string, string> = {
  '쥐': 'Rat', '소': 'Ox', '호랑이': 'Tiger', '토끼': 'Rabbit',
  '용': 'Dragon', '뱀': 'Snake', '말': 'Horse', '양': 'Goat',
  '원숭이': 'Monkey', '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig',
};

const REASON_EXPLAIN: Record<AvoidReasonCode, { ko: string; en: string; tagKo: string; tagEn: string }> = {
  chung: {
    tagKo: '#충', tagEn: '#Clash',
    ko: '일지(日支)끼리 정면 충돌하는 관계예요. 가치관과 생활 방식이 정반대라 함께 있으면 갈등이 커지기 쉬워요.',
    en: 'A direct branch clash — your lifestyles and values point in opposite directions, creating friction.',
  },
  hyung: {
    tagKo: '#형', tagEn: '#Punishment',
    ko: '서로를 자극하여 스트레스를 유발하는 관계예요. 가까울수록 예민해지고, 사소한 것이 큰 다툼으로 번지기 쉬워요.',
    en: 'A punishment pattern — the closer you get, the more you irritate each other over small things.',
  },
  pa: {
    tagKo: '#파', tagEn: '#Break',
    ko: '겉으론 괜찮아 보이지만 안에서 서서히 균열이 생기는 관계예요. 은근한 불만이 쌓여 어느 날 갑자기 터지기 쉬워요.',
    en: 'Looks fine on the surface but cracks form underneath — resentment builds until it suddenly erupts.',
  },
  hae: {
    tagKo: '#해', tagEn: '#Harm',
    ko: '좋은 인연을 방해하는 관계예요. 이 사람과 가까워지면 다른 좋은 관계까지 영향을 받을 수 있어요.',
    en: 'This connection can interfere with other positive relationships in your life.',
  },
  stemGeuk: {
    tagKo: '#천간상극', tagEn: '#StemClash',
    ko: '일간끼리 직접 부딪히는 관계예요. 근본적인 기질이 충돌해서, 깊어질수록 갈등이 커져요.',
    en: 'Your day stems directly oppose each other — fundamental temperament clash.',
  },
  ohGeuk: {
    tagKo: '#오행상극', tagEn: '#ElementClash',
    ko: '상대의 오행이 내 오행을 직접 극하는 관계예요. 상대가 강해질수록 내가 위축돼요.',
    en: 'Their dominant element directly overcomes yours — you shrink as they grow stronger.',
  },
  ohOverGeuk: {
    tagKo: '#과극', tagEn: '#OverControl',
    ko: '이미 약한 내 기운을 상대가 더 눌러요. 에너지 불균형이 극심한 관계예요.',
    en: 'They press down on your already weak element — extreme energy imbalance.',
  },
};

const EL_HERO_BG: Record<string, string> = {
  '목': 'from-red-100 to-orange-50 dark:from-red-950/60 dark:to-orange-950/30',
  '화': 'from-slate-200 to-blue-50 dark:from-slate-900 dark:to-blue-950/30',
  '토': 'from-emerald-100 to-green-50 dark:from-emerald-950/60 dark:to-green-950/30',
  '금': 'from-red-100 to-rose-50 dark:from-red-950/50 dark:to-rose-950/30',
  '수': 'from-yellow-100 to-amber-50 dark:from-yellow-950/60 dark:to-amber-950/30',
};

const EL_BADGE_SOLID: Record<string, string> = {
  '목': 'bg-red-600 text-white',
  '화': 'bg-slate-700 text-white',
  '토': 'bg-emerald-600 text-white',
  '금': 'bg-red-500 text-white',
  '수': 'bg-yellow-600 text-black',
};

interface Props {
  pillars: Pillar[];
  birthYear?: number;
}

function ReasonChip({ code, label, points }: { code: AvoidReasonCode; label: string; points: number }) {
  const { lang } = useLang();
  const info = REASON_EXPLAIN[code];
  const displayTag = lang === 'en' ? info.tagEn : info.tagKo;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-900/60 border border-red-200 dark:border-red-800 text-[10.5px] font-medium text-gray-700 dark:text-gray-200">
      <span className="text-red-600 dark:text-red-400 font-bold">{displayTag}</span>
      <span className="text-gray-300 dark:text-gray-600">·</span>
      <span>{label}</span>
      <span className="text-red-600 dark:text-red-400 font-bold">+{points}</span>
    </span>
  );
}

export function AvoidanceSection({ pillars, birthYear }: Props) {
  const { t, lang } = useLang();

  const result = useMemo(
    () => computeAvoidance(pillars, birthYear),
    [pillars, birthYear],
  );

  if (!result) return null;

  const avoidOh = result.avoidStemOh[0];
  const avoidOhLabel = lang === 'en' ? OH_EN[avoidOh] ?? avoidOh : avoidOh;

  // 주의 생년 → 띠별 그룹
  const yearsByZodiac = (() => {
    const g = new Map<string, number[]>();
    for (const it of result.avoidYears) {
      const arr = g.get(it.zodiac) || [];
      arr.push(it.year);
      g.set(it.zodiac, arr);
    }
    return Array.from(g.entries());
  })();

  return (
    <>
      {/* 분석 방식 안내 */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3 leading-snug px-1 italic">
        {t(
          '충·형·파·상극으로 분석한 나와 부딪히는 사주 유형입니다. 모든 관계는 노력으로 개선할 수 있으며, 참고 목적으로 가볍게 봐주세요.',
          'Analyzed via clash, punishment, break, and element opposition. All relationships can improve with effort — take this as entertainment only.'
        )}
      </p>

      {/* === Hero 카드 (피해야 할 유형) === */}
      <div className={`relative overflow-hidden rounded-[20px] mb-3 bg-gradient-to-br ${EL_HERO_BG[avoidOh] ?? 'from-red-100 to-orange-50 dark:from-red-950/60 dark:to-orange-950/30'} shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-red-100 dark:border-red-900`}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.14em] text-red-600 dark:text-red-400 uppercase mb-1">
                {t('피해야 할 유형', 'Type to Avoid')}
              </div>
              <div className="text-[20px] font-extrabold text-gray-900 dark:text-gray-100 leading-[1.25] tracking-[-0.02em]">
                {lang === 'en'
                  ? `People with ${avoidOhLabel} energy may clash with you.`
                  : result.summary}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <div className="text-[11px] font-semibold text-red-500 dark:text-red-400">{t('위험도', 'Risk')}</div>
              <div className="text-[28px] font-black text-red-600 dark:text-red-400 leading-none mt-0.5">
                {result.dangerScore.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">/ 10</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] font-bold shrink-0 ${EL_BADGE_SOLID[avoidOh] ?? 'bg-red-700 text-white'}`}>
              {result.avoidStem}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('주의 일간', 'Risky Day Stem')}</div>
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">
                {result.avoidStem} · {t(`${avoidOh} 기운`, `${avoidOhLabel} energy`)}
              </div>
            </div>
          </div>

          {/* 근거 칩 */}
          {result.scoreReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {result.scoreReasons.map((r, i) => (
                <ReasonChip key={i} code={r.code} label={r.label} points={r.points} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === 주의할 띠 카드 === */}
      {result.avoidZodiacs.length > 0 && (
        <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 mb-3">
          <div className="text-[11px] font-bold text-red-500 dark:text-red-400 mb-2 tracking-wide">
            {t('⚠️ 주의할 띠', '⚠️ Zodiacs to Watch')}
          </div>
          <div className="flex flex-wrap gap-2">
            {result.avoidZodiacs.map((z, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-[12px] font-semibold border border-red-100 dark:border-red-900">
                {lang === 'en' ? (ZODIAC_EN[z] ?? z) : z}
              </span>
            ))}
          </div>
          {yearsByZodiac.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="text-[10.5px] text-gray-400 dark:text-gray-500 mb-1.5">{t('동년배 중 주의 생년', 'Birth years to note')}</div>
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {yearsByZodiac.map(([zodiac, years]) => (
                  <span key={zodiac} className="text-[12px] text-gray-700 dark:text-gray-200">
                    <span className="font-bold">{years.join('·')}</span>
                    <span className="text-gray-400 ml-1">{lang === 'en' ? (ZODIAC_EN[zodiac] ?? zodiac) : zodiac}</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === 상세 해석 카드 === */}

      {/* ② 처음엔 이렇게 느껴져요 */}
      <ToggleSection title={t('처음엔 이렇게 느껴져요', 'First Impressions')} defaultOpen>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {result.firstImpression}
        </p>
      </ToggleSection>

      {/* ③ 왜 부딪히게 될까 */}
      <ToggleSection
        title={t('왜 부딪히게 될까', 'Why You Clash')}
        titleClassName="text-[15px] font-bold text-red-600 dark:text-red-400 tracking-wide"
      >
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {result.conflictMechanism}
        </p>
      </ToggleSection>

      {/* ④ 어떤 상황에서 트러블이 생길까 */}
      <ToggleSection
        title={t('어떤 상황에서 트러블이 생길까', 'When Trouble Arises')}
        titleClassName="text-[15px] font-bold text-red-600 dark:text-red-400 tracking-wide"
      >
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {result.conflictScenario}
        </p>
      </ToggleSection>

      {/* ⑤ 이 관계에서 내가 받는 영향 */}
      <ToggleSection
        title={t('이 관계에서 내가 받는 영향', 'How It Affects You')}
        titleClassName="text-[15px] font-bold text-orange-600 dark:text-orange-400 tracking-wide"
      >
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {result.energyDrain}
        </p>
      </ToggleSection>

      {/* ⑥ 이런 신호가 보이면 거리두기 */}
      <ToggleSection
        title={t('이런 신호가 보이면 거리두기', 'Red Flags — Time to Step Back')}
        titleClassName="text-[15px] font-bold text-orange-600 dark:text-orange-400 tracking-wide"
      >
        <div className="space-y-2.5">
          {result.redFlags.map((flag, i) => (
            <div key={i} className="rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 p-4">
              <p className="text-[13.5px] text-gray-700 dark:text-gray-200 leading-[1.75]">
                🚩 {flag}
              </p>
            </div>
          ))}
        </div>
      </ToggleSection>

      {/* ⑦ 만약 이미 가까운 사이라면 */}
      <ToggleSection
        title={t('이미 가까운 사이라면', 'If You Are Already Close')}
        titleClassName="text-[15px] font-bold text-amber-600 dark:text-amber-400 tracking-wide"
      >
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {result.copingAdvice}
        </p>
        <p className="mt-4 text-[10.5px] text-gray-400 dark:text-gray-500 leading-snug">
          {t(
            '충·형·파·상극을 종합한 해석입니다. 모든 관계는 노력과 이해로 달라질 수 있어요. 재미로 참고해주세요.',
            'A combined reading of clash, punishment, break, and element opposition. Every relationship can improve with effort — for entertainment only.'
          )}
        </p>
      </ToggleSection>
    </>
  );
}
