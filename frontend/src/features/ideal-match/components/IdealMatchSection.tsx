'use client';

import { useMemo, useState } from 'react';
import { trackEvent } from '@/shared/lib/trackEvent';
import { useLang } from '@/shared/lib/LangContext';
import type { Pillar } from '@/features/fortune/lib/engine';
import { computeIdealMatch, type Gender, type MatchMode } from '../lib/matchEngine';
import { ShareCard } from './ShareCard';
import { ReasonChip, REASON_EXPLAIN } from './ReasonChip';
import { CompatibleAnimalsSection } from './CompatibleAnimalsSection';

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

function tagToEn(tag: string): string {
  // "목 일간" → "Wood Day Stem"
  const m = tag.match(/^([목화토금수])\s*일간$/);
  if (m) return `${OH_EN[m[1]]} Day Stem`;
  const m2 = tag.match(/^([목화토금수])\s*보완$/);
  if (m2) return `${OH_EN[m2[1]]} Fill`;
  // 띠 라벨
  if (ZODIAC_EN[tag]) return ZODIAC_EN[tag];
  return tag;
}
function reasonLabelEn(code: string, label: string): string {
  // 라벨은 이제 한국어 서술형 — 영문은 짧은 명사구로 대응.
  // 오행 글자가 어디든 들어있으면 Wood/Fire/... 치환을 찾아둠.
  const ohMatch = label.match(/([목화토금수])/);
  const oh = ohMatch ? OH_EN[ohMatch[1]] : '';
  switch (code) {
    case 'lacking': return oh ? `Fills the missing ${oh} energy` : 'Fills the missing element';
    case 'excess': return oh ? `Balances the overloaded ${oh}` : 'Balances an overloaded element';
    case 'stemHap': return 'Natural attraction (stem harmony)';
    case 'spouseGwan': return 'Matches the traditional "spouse seat"';
    case 'spouseJae': return 'Matches the traditional "spouse seat"';
    case 'samhap': return 'Zodiac triple harmony';
    case 'yukhap': return 'Zodiac pair harmony';
    default: return label;
  }
}

interface Props {
  pillars: Pillar[];
  gender?: Gender;
  /** 본인 출생년 — 동년배 ±7년 범위에서 추천 생년 도출 */
  birthYear?: number;
}

const EL_BG: Record<string, string> = {
  '목': 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
  '화': 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
  '토': 'bg-yellow-50 dark:bg-yellow-950/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
  '금': 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700',
  '수': 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700',
};

const EL_HERO_BG: Record<string, string> = {
  '목': 'from-emerald-100 to-emerald-50 dark:from-emerald-950/60 dark:to-emerald-950/30',
  '화': 'from-red-100 to-red-50 dark:from-red-950/60 dark:to-red-950/30',
  '토': 'from-yellow-100 to-yellow-50 dark:from-yellow-950/60 dark:to-yellow-950/30',
  '금': 'from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900',
  '수': 'from-gray-200 to-gray-100 dark:from-gray-900 dark:to-gray-950',
};

const EL_BADGE_SOLID: Record<string, string> = {
  '목': 'bg-emerald-500 text-white',
  '화': 'bg-red-600 text-white',
  '토': 'bg-yellow-500 text-black',
  '금': 'bg-gray-300 text-gray-800',
  '수': 'bg-gray-900 text-white',
};

export function IdealMatchSection({ pillars, gender, birthYear }: Props) {
  const { t, lang, localePath } = useLang();
  const mode: MatchMode = 'spouse';
  const [shareOpen, setShareOpen] = useState(false);

  const match = useMemo(
    () => computeIdealMatch(pillars, gender || '', birthYear, mode),
    [pillars, gender, birthYear],
  );

  if (!match) return null;

  const primaryOh = match.idealStemOh[0];
  const primaryStem = match.tags[0]?.replace(/\s*일간$/, '') ?? primaryOh;
  const primaryOhLabel = lang === 'en' ? OH_EN[primaryOh] ?? primaryOh : primaryOh;
  const genderHint = !gender
    ? t(
        '성별을 선택하시면 배우자궁(관성·재성) 해석까지 반영돼요.',
        'Select a gender to include Spouse Star (Gwan/Jae) weighting.'
      )
    : null;

  // 추천 생년 → 띠별 그룹
  const yearsByZodiac = (() => {
    const g = new Map<string, number[]>();
    for (const it of match.idealYears) {
      const arr = g.get(it.zodiac) || [];
      arr.push(it.year);
      g.set(it.zodiac, arr);
    }
    return Array.from(g.entries());
  })();

  return (
    <>
      {/* === 공유 버튼 === */}
      <div className="flex items-center justify-end mb-2">
        <button
          type="button"
          onClick={() => {
            setShareOpen(true);
            trackEvent('ideal_match_share_open');
          }}
          className="shrink-0 h-8 px-3 rounded-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11.5px] font-bold border-none cursor-pointer hover:opacity-90 transition-opacity"
        >
          {t('공유', 'Share')}
        </button>
      </div>

      {/* 역산 방식 안내 */}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-3 leading-snug px-1 italic">
        {t(
          '상대의 생년월일 없이 내 사주만으로 이상형을 역산합니다. 점수는 이 추천이 내 결핍·과잉을 얼마나 잘 보완하는지 보여주는 적합도예요.',
          'We reverse-engineer an ideal partner from your chart alone — no partner data. The score shows how well this recommendation fills the gaps in your chart.'
        )}
      </p>
      {/* === Hero 파트너 카드 (당신의 이상형) === */}
      <div className={`relative overflow-hidden rounded-[20px] mb-3 bg-gradient-to-br ${EL_HERO_BG[primaryOh] ?? 'from-gray-100 to-gray-50 dark:from-gray-800 dark:to-gray-900'} shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800`}>
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="text-[10.5px] font-bold tracking-[0.14em] text-gray-500 dark:text-gray-300 uppercase mb-1">
                {t('당신의 이상형', 'Your Ideal Match')}
              </div>
              <div className="text-[20px] font-extrabold text-gray-900 dark:text-gray-100 leading-[1.25] tracking-[-0.02em]">
                {lang === 'en'
                  ? `A partner with ${primaryOhLabel} energy fits you well.`
                  : match.summary}
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-center">
              <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-300">{t('적합도', 'Fit')}</div>
              <div className="text-[28px] font-black text-gray-900 dark:text-gray-50 leading-none mt-0.5">
                {match.score.toFixed(1)}
              </div>
              <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">/ 10</div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className={`w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] font-bold shrink-0 ${EL_BADGE_SOLID[primaryOh] ?? 'bg-gray-700 text-white'}`}>
              {primaryStem}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{t('추천 일간', 'Suggested Day Stem')}</div>
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-100 truncate">
                {primaryStem} · {t(`${primaryOh} 기운`, `${primaryOhLabel} energy`)}
              </div>
            </div>
          </div>

          {/* 근거 칩 (클릭 시 설명 툴팁) */}
          {match.scoreReasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {match.scoreReasons.map((r, i) => (
                <ReasonChip
                  key={i}
                  code={r.code}
                  label={r.label}
                  labelEn={reasonLabelEn(r.code, r.label)}
                  points={r.points}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === 잘 어울리는 동물 카드 그리드 === */}
      {match.idealZodiacs.length > 0 && (
        <CompatibleAnimalsSection
          idealZodiacs={match.idealZodiacs}
          primaryOh={primaryOh}
        />
      )}

      {/* === 상세 해석: 9개 분리 카드 === */}

      {/* ② 이 사람 첫인상 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">
          {t('이 사람 첫인상', 'First Impression')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.firstImpression}
        </p>
      </div>

      {/* ③ 이 사람 속마음 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-gray-500 dark:text-gray-400 mb-2 tracking-wide">
          {t('이 사람 속마음', 'Behind the Surface')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.innerSelf}
        </p>
      </div>

      {/* ④ 왜 나랑 잘 맞을까 ①: 성격 궁합 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-pink-600 dark:text-pink-400 mb-2 tracking-wide">
          {t('왜 나랑 잘 맞을까 ①: 성격 궁합', 'Why We Click ①: Personality')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.chemistryStory}
        </p>
      </div>

      {/* ⑤ 왜 나랑 잘 맞을까 ②: 연애할 때 케미 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-pink-600 dark:text-pink-400 mb-2 tracking-wide">
          {t('왜 나랑 잘 맞을까 ②: 연애할 때 케미', 'Why We Click ②: Dating Chemistry')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.datingChemistry}
        </p>
      </div>

      {/* ⑥ 어디서 만나게 될까 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-violet-600 dark:text-violet-400 mb-2 tracking-wide">
          {t('어디서 만나게 될까', 'Where Might You Meet?')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.meetingScenario}
        </p>
      </div>

      {/* ⑦ 어떻게 가까워질까 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-violet-600 dark:text-violet-400 mb-2 tracking-wide">
          {t('어떻게 가까워질까', 'How to Get Closer')}
        </div>
        <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
          {match.approachStory}
        </p>
      </div>

      {/* ⑧ 이런 순간에 설렐 거예요 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-3">
        <div className="text-[12px] font-bold text-rose-600 dark:text-rose-400 mb-3 tracking-wide">
          {t('이런 순간에 설렐 거예요', 'Moments That Will Make Your Heart Flutter')}
        </div>
        <div className="space-y-3">
          {match.sparkMoments.map((moment, i) => (
            <div key={i} className="rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 p-4">
              <p className="text-[13.5px] text-gray-700 dark:text-gray-200 leading-[1.75]">
                {moment}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ⑨ 주의할 점 + 추천/주의 띠 */}
      <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-4">
        {match.cautions.length > 0 && (
          <div className="mb-4">
            <div className="text-[12px] font-bold text-amber-600 dark:text-amber-400 mb-2 tracking-wide">
              {t('주의할 점', 'Watch Out')}
            </div>
            <p className="text-[14px] text-gray-700 dark:text-gray-200 leading-[1.8]">
              {match.cautions.map(c => c.desc).join(' ')}
            </p>
          </div>
        )}
        {(match.idealZodiacs.length > 0 || match.avoidZodiacs.length > 0) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            {match.idealZodiacs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                  {t('추천 띠', 'Best')}
                </span>
                {match.idealZodiacs.map((z, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-600 dark:text-pink-300 text-[11px] font-medium">
                    {lang === 'en' ? (ZODIAC_EN[z] ?? z) : z}
                  </span>
                ))}
              </div>
            )}
            {match.avoidZodiacs.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">
                  {t('주의 띠', 'Avoid')}
                </span>
                {match.avoidZodiacs.map((z, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                    {lang === 'en' ? (ZODIAC_EN[z] ?? z) : z}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        <p className="mt-4 text-[10.5px] text-gray-400 dark:text-gray-500 leading-snug">
          {t(
            '오행 보완·천간합·지지 삼합/육합을 종합한 해석입니다. 재미로 참고해주세요.',
            'A combined reading of element balance, stem harmony, and branch harmony — for entertainment only.'
          )}
        </p>
      </div>

      {/* === 커플 궁합 CTA 배너 === */}
      <a
        href={localePath('/couple/')}
        onClick={() => trackEvent('ideal_match_to_couple', { primary_oh: primaryOh })}
        className="group block rounded-[18px] overflow-hidden mb-4 no-underline bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 transition-colors shadow-sm"
      >
        <div className="px-5 py-5 flex items-center gap-3">
          <div className="shrink-0 w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-[22px]">
            💞
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[18px] font-extrabold text-white leading-tight">
              {t('생각나는 사람이 있나요?', 'Someone on your mind?')}
            </div>
            <div className="text-[13px] font-bold text-white/90 leading-snug mt-1.5">
              {t('실제 궁합도 확인해보세요', 'Check the real couple match')}
            </div>
            <div className="text-[11.5px] text-white/75 leading-snug mt-1">
              {t(
                '상대 생년월일을 넣으면 두 사주 간 일간 관계·일지 합충까지 비교해드려요',
                'Enter both birth dates to compare day stems and branches directly'
              )}
            </div>
          </div>
          <div className="shrink-0 text-white text-[24px] font-bold group-hover:translate-x-0.5 transition-transform">
            →
          </div>
        </div>
      </a>

      {shareOpen && (
        <ShareCard
          match={match}
          mode={mode}
          primaryStem={primaryStem}
          primaryOh={primaryOh}
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}
