'use client';

import { useRef, useState, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useLang } from '@/shared/lib/LangContext';
import { ZodiacIcon } from '@/shared/ui/ZodiacIcon';
import { BRANCHES, type Oh } from '@/shared/lib/gapja';

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

/** 동물별 주의 포인트 태그 */
const ZODIAC_CAUTION_TRAITS: Record<string, { ko: string[]; en: string[] }> = {
  '쥐': { ko: ['계산적', '변덕스러움', '의심 많음'], en: ['Calculating', 'Moody', 'Suspicious'] },
  '소': { ko: ['고집 셈', '변화 거부', '답답함'], en: ['Stubborn', 'Resistant', 'Frustrating'] },
  '호랑이': { ko: ['독선적', '충돌 잦음', '통제욕'], en: ['Overbearing', 'Combative', 'Controlling'] },
  '토끼': { ko: ['우유부단', '회피형', '감정 기복'], en: ['Indecisive', 'Avoidant', 'Moody'] },
  '용': { ko: ['자기중심', '압도적', '타협 불가'], en: ['Self-centered', 'Overwhelming', 'Inflexible'] },
  '뱀': { ko: ['의심 많음', '집착', '냉소적'], en: ['Suspicious', 'Possessive', 'Cynical'] },
  '말': { ko: ['충동적', '산만함', '끈기 부족'], en: ['Impulsive', 'Scattered', 'Impatient'] },
  '양': { ko: ['우유부단', '의존적', '소극적'], en: ['Indecisive', 'Dependent', 'Passive'] },
  '원숭이': { ko: ['가벼움', '신뢰 부족', '변덕'], en: ['Flippant', 'Unreliable', 'Fickle'] },
  '닭': { ko: ['잔소리', '완벽주의', '비판적'], en: ['Nagging', 'Perfectionist', 'Critical'] },
  '개': { ko: ['의심 많음', '예민함', '방어적'], en: ['Distrustful', 'Sensitive', 'Defensive'] },
  '돼지': { ko: ['안일함', '우유부단', '경계 부족'], en: ['Complacent', 'Indecisive', 'Gullible'] },
};

interface Props {
  avoidZodiacs: string[];
}

/** 개별 동물 미니 카드 (경고 스타일) */
function AnimalCard({
  zodiac,
  lang,
  t,
}: {
  zodiac: string;
  lang: string;
  t: (ko: string, en: string) => string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);

  const branch = findBranch(zodiac);
  if (!branch) return null;

  const zodiacLabel = lang === 'en'
    ? (ZODIAC_EN[zodiac] ?? zodiac)
    : branch.zodiacKo;
  const moodLabel = branch.mood;
  const traits = ZODIAC_CAUTION_TRAITS[zodiac];

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
      link.download = `incompatible-${zodiac}-${Date.now()}.png`;
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
          border: '1px solid #FEE2E2',
        }}
      >
        {/* 동물 아이콘 */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'linear-gradient(145deg, #FEF2F2 0%, #FFFFFF 100%)',
            boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
            color: '#DC2626',
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
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  fontSize: 9.5,
                  fontWeight: 600,
                  padding: '3px 7px',
                  borderRadius: 6,
                  border: '1px solid #FECACA',
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

export function IncompatibleAnimalsSection({ avoidZodiacs }: Props) {
  const { t, lang } = useLang();

  if (avoidZodiacs.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="px-1 pt-2 pb-3">
        {/* 동물 카드 3열 */}
        <div className="flex gap-2.5 justify-center">
          {avoidZodiacs.slice(0, 3).map((zodiac) => (
            <AnimalCard
              key={zodiac}
              zodiac={zodiac}
              lang={lang}
              t={t}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
