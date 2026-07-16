'use client';

import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useLang } from '@/shared/lib/LangContext';
import { ZodiacIcon } from '@/shared/ui/ZodiacIcon';
import { BRANCHES, OH_TONE, type Oh } from '@/shared/lib/gapja';

/** 띠 한글(쥐, 소 등) → BranchInfo */
function findBranch(zodiacKo: string) {
  return BRANCHES.find(
    b => b.zodiacKo === zodiacKo || b.zodiacKo.replace('띠', '') === zodiacKo,
  );
}

const ZODIAC_EN: Record<string, string> = {
  '쥐': 'Rat', '소': 'Ox', '호랑이': 'Tiger', '토끼': 'Rabbit',
  '용': 'Dragon', '뱀': 'Snake', '말': 'Horse', '양': 'Goat',
  '원숭이': 'Monkey', '닭': 'Rooster', '개': 'Dog', '돼지': 'Pig',
};

/** 동물별 강점 태그 (간단 2~3개) */
const ZODIAC_TRAITS: Record<string, { ko: string[]; en: string[] }> = {
  '쥐': { ko: ['눈치 빠름', '적응력 높음', '사교적'], en: ['Quick-witted', 'Adaptable', 'Sociable'] },
  '소': { ko: ['성실함', '인내심 강함', '신뢰감'], en: ['Diligent', 'Patient', 'Trustworthy'] },
  '호랑이': { ko: ['리더십', '자신감', '결단력'], en: ['Leadership', 'Confident', 'Decisive'] },
  '토끼': { ko: ['감수성 풍부', '부드러운 매력', '공감 능력'], en: ['Sensitive', 'Gentle charm', 'Empathetic'] },
  '용': { ko: ['카리스마', '추진력', '큰 그림'], en: ['Charismatic', 'Driven', 'Big picture'] },
  '뱀': { ko: ['지적 매력', '차분함', '분석력'], en: ['Intellectual', 'Calm', 'Analytical'] },
  '말': { ko: ['활동적', '솔직함', '열정적'], en: ['Active', 'Honest', 'Passionate'] },
  '양': { ko: ['온화함', '배려심', '예술 감성'], en: ['Gentle', 'Caring', 'Artistic'] },
  '원숭이': { ko: ['재치', '순발력', '유머감각'], en: ['Witty', 'Quick', 'Humorous'] },
  '닭': { ko: ['꼼꼼함', '자기관리', '정직함'], en: ['Detail-oriented', 'Self-disciplined', 'Honest'] },
  '개': { ko: ['의리', '한결같음', '충성심'], en: ['Loyal', 'Consistent', 'Faithful'] },
  '돼지': { ko: ['너그러움', '낙천적', '정이 많음'], en: ['Generous', 'Optimistic', 'Warm-hearted'] },
};

interface Props {
  idealZodiacs: string[];
  primaryOh: string;
}

/** 개별 동물 미니 카드 (이미지 저장 가능) */
function AnimalCard({
  zodiac,
  primaryOh,
  lang,
  t,
}: {
  zodiac: string;
  primaryOh: string;
  lang: string;
  t: (ko: string, en: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const tone = OH_TONE[primaryOh as Oh] ?? OH_TONE['목'];

  const branch = findBranch(zodiac);
  if (!branch) return null;

  const zodiacLabel = lang === 'en'
    ? (ZODIAC_EN[zodiac] ?? zodiac)
    : branch.zodiacKo;
  const moodLabel = branch.mood;
  const traits = ZODIAC_TRAITS[zodiac];

  const handleSave = useCallback(async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#FFFFFF',
      });
      const link = document.createElement('a');
      link.download = `compatible-${zodiac}-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('animal card export failed', err);
    } finally {
      setSaving(false);
    }
  }, [saving, zodiac]);

  return (
    <div className="flex flex-col items-center flex-1 min-w-0">
      {/* 캡처 대상 — 9:16 모바일 비율 */}
      <div
        ref={cardRef}
        className="w-full rounded-[16px] overflow-hidden"
        style={{
          aspectRatio: '9 / 16',
          maxWidth: 200,
          background: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px 10px 16px',
          border: '1px solid #F3F4F6',
        }}
      >
        {/* 동물 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: `linear-gradient(145deg, ${tone.bg} 0%, #FFFFFF 100%)`,
            boxShadow: `0 2px 8px ${tone.bg}80`,
            color: tone.fg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <ZodiacIcon branch={branch.hanja} size={38} />
        </div>

        {/* 이름 */}
        <div style={{ fontSize: 14, fontWeight: 900, color: '#1A1A1A', textAlign: 'center', marginBottom: 3 }}>
          {zodiacLabel}
        </div>

        {/* 설명 */}
        <div style={{ fontSize: 10, color: '#9CA3AF', textAlign: 'center', lineHeight: 1.5, marginBottom: 12, padding: '0 2px' }}>
          {moodLabel}
        </div>

        {/* 칩 */}
        {traits && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
            {(lang === 'en' ? traits.en : traits.ko).map((trait) => (
              <span
                key={trait}
                style={{
                  background: '#F9FAFB',
                  color: '#374151',
                  fontSize: 9.5,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 6,
                  border: '1px solid #E5E7EB',
                }}
              >
                {trait}
              </span>
            ))}
          </div>
        )}

        {/* 풋터 */}
        <div style={{ marginTop: 'auto', paddingTop: 10, fontSize: 8, color: '#D1D5DB', fontWeight: 500 }}>
          saju.sedaily.ai
        </div>
      </div>

      {/* 저장 버튼 */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-1.5 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-[10px] font-semibold text-gray-500 dark:text-gray-400 border-none cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {saving ? '...' : t('저장', 'Save')}
      </button>
    </div>
  );
}

export function CompatibleAnimalsSection({ idealZodiacs, primaryOh }: Props) {
  const { t, lang } = useLang();
  const tone = OH_TONE[primaryOh as Oh] ?? OH_TONE['목'];

  if (idealZodiacs.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="px-1 pt-2 pb-3">
        {/* 동물 카드 3열 */}
        <div className="flex gap-2.5 justify-center">
          {idealZodiacs.map((zodiac) => (
            <AnimalCard
              key={zodiac}
              zodiac={zodiac}
              primaryOh={primaryOh}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
