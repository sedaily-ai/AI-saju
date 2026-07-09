'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useLang } from '@/shared/lib/LangContext';
import { SAJU, SERIF } from '@/shared/ui/sajuTokens';
import { ZodiacIcon } from '@/shared/ui/ZodiacIcon';
import { buildGapjaList, OH_TONE, readMyDayGapjaId, type GapjaCharacter } from '../lib/gapja';

const GAPJA_LIST = buildGapjaList();
const INITIAL_VISIBLE = 9;

function matchesQuery(g: GapjaCharacter, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    g.stem.hanja, g.branch.hanja, g.stem.ko, g.branch.ko,
    g.branch.zodiacKo, g.stem.keyword,
  ].join(' ').toLowerCase();
  return haystack.includes(q);
}

export function CharacterGrid() {
  const { t } = useLang();
  const [selected, setSelected] = useState<GapjaCharacter | null>(null);
  const [myId, setMyId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setMyId(readMyDayGapjaId());
  }, []);

  useEffect(() => {
    if (!myId) return;
    const mine = GAPJA_LIST.find(g => g.id === myId);
    if (mine) setSelected(mine);
  }, [myId]);

  const filtered = useMemo(() => GAPJA_LIST.filter(g => matchesQuery(g, query)), [query]);
  const isSearching = query.trim().length > 0;
  const visible = isSearching ? filtered : (expanded ? GAPJA_LIST : GAPJA_LIST.slice(0, INITIAL_VISIBLE));

  return (
    <div>
      {/* 안내 — 페이지 개념 + 사용법 */}
      <div className="rounded-[18px] bg-white px-4 py-3.5 mb-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <p className="text-[12.5px] leading-relaxed" style={{ color: SAJU.inkSoft }}>
          {t(
            '태어난 날의 천간·지지 조합마다 고유한 캐릭터가 있어요. 검색으로 바로 찾거나, 아래에서 하나씩 눌러 구경해보세요.',
            'Every stem·branch combination of your birth day has its own character. Search directly, or tap through the cards below.',
          )}
        </p>
      </div>

      {selected && <CharacterDetail character={selected} isMine={selected.id === myId} />}

      {/* 검색 */}
      <div
        className="flex items-center gap-2 rounded-full pl-4 pr-3 py-2.5 mb-4"
        style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <Search size={14} strokeWidth={2.2} style={{ color: SAJU.inkSub }} className="shrink-0" />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('이름이나 띠로 검색', 'Search by name or zodiac')}
          className="flex-1 min-w-0 bg-transparent text-[13px] outline-none placeholder:text-gray-400"
          style={{ color: SAJU.ink }}
        />
      </div>

      {isSearching ? (
        <p className="px-1 mb-3 text-[11.5px]" style={{ color: SAJU.inkSub }}>
          {t(`${filtered.length}개 찾음`, `${filtered.length} found`)}
        </p>
      ) : (
        !myId && (
          <p className="px-1 mb-3 text-[11.5px]" style={{ color: SAJU.inkSub }}>
            {t('사주를 입력하면 내 캐릭터가 위에 강조돼요.', 'Enter your saju to highlight yours above.')}
          </p>
        )
      )}

      {visible.length === 0 ? (
        <p className="px-1 py-8 text-center text-[13px]" style={{ color: SAJU.inkSub }}>
          {t('일치하는 캐릭터가 없어요.', 'No matching character.')}
        </p>
      ) : (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {visible.map(g => (
            <li key={g.id}>
              <CharacterTile
                character={g}
                isMine={g.id === myId}
                onClick={() => setSelected(g)}
                label={t('나', 'Me')}
                ohLabel={t('기운', 'energy')}
              />
            </li>
          ))}
        </ul>
      )}

      {!isSearching && !expanded && GAPJA_LIST.length > INITIAL_VISIBLE && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="w-full mt-4 flex items-center justify-center gap-1 py-3 text-[12.5px] font-semibold rounded-full transition-colors bg-white hover:bg-gray-50"
          style={{ color: SAJU.inkSoft, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {t(`${GAPJA_LIST.length - INITIAL_VISIBLE}명 더보기`, `Show ${GAPJA_LIST.length - INITIAL_VISIBLE} more`)}
        </button>
      )}
      {!isSearching && expanded && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="w-full mt-4 py-3 text-[12.5px] font-semibold rounded-full transition-colors"
          style={{ color: SAJU.inkSub }}
        >
          {t('접기', 'Collapse')}
        </button>
      )}
    </div>
  );
}

function CharacterTile({
  character, isMine, onClick, label, ohLabel,
}: { character: GapjaCharacter; isMine: boolean; onClick: () => void; label: string; ohLabel: string }) {
  const tone = OH_TONE[character.stem.oh];
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full flex flex-col rounded-[22px] bg-white p-4 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span
          className="rounded-full px-2 py-0.5 text-[10px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {character.stem.oh} {ohLabel}
        </span>
        {isMine && (
          <span
            className="rounded-full px-2 py-0.5 text-[9.5px] font-bold text-white"
            style={{ background: SAJU.warmDeep }}
          >
            {label}
          </span>
        )}
      </div>

      <div className="flex flex-col items-center text-center">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-2.5"
          style={{ background: `linear-gradient(135deg, ${tone.bg} 0%, #FFFFFF 100%)`, color: tone.fg }}
        >
          <ZodiacIcon branch={character.branch.hanja} size={32} />
        </div>
        <h4 className="text-[14.5px] font-black" style={{ fontFamily: SERIF, color: SAJU.ink }}>
          {character.stem.ko}{character.branch.ko}
        </h4>
        <p className="text-[11px] font-bold mt-0.5" style={{ color: tone.fg }}>
          {character.stem.keyword}
        </p>
      </div>

      <p
        className="mt-2.5 text-[11px] leading-snug text-center"
        style={{
          color: SAJU.inkSub,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {character.branch.mood}
      </p>
    </button>
  );
}

function CharacterDetail({ character, isMine }: { character: GapjaCharacter; isMine: boolean }) {
  const { t } = useLang();
  const tone = OH_TONE[character.stem.oh];

  return (
    <div
      className="relative mb-4 rounded-[24px] bg-white pt-7 pb-5 px-5 flex flex-col items-center text-center"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
    >
      <div className="absolute top-4 left-4">
        <span
          className="rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          {character.stem.oh} {t('기운', 'energy')}
        </span>
      </div>
      {isMine && (
        <span
          className="absolute top-4 right-4 rounded-full px-2.5 py-1 text-[10.5px] font-bold text-white"
          style={{ background: SAJU.warmDeep }}
        >
          {t('나의 캐릭터', 'My character')}
        </span>
      )}

      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-4"
        style={{ background: `linear-gradient(135deg, ${tone.bg} 0%, #FFFFFF 100%)`, color: tone.fg }}
      >
        <ZodiacIcon branch={character.branch.hanja} size={54} />
      </div>

      <h3 className="text-[22px] font-black" style={{ color: SAJU.ink, fontFamily: SERIF }}>
        {character.stem.ko}{character.branch.ko}
        <span className="text-[13px] font-semibold ml-1.5" style={{ color: SAJU.inkSub }}>
          {character.stem.hanja}{character.branch.hanja}
        </span>
      </h3>
      <p className="text-[13.5px] font-bold mt-1" style={{ color: tone.fg }}>
        {character.stem.keyword}
      </p>

      <div
        className="mt-4 rounded-2xl px-4 py-3 text-[13px] leading-relaxed max-w-[320px]"
        style={{ background: tone.bg, color: SAJU.inkSoft }}
      >
        “{character.branch.mood}”
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 mt-4">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: '#F7F5F2', color: SAJU.inkSoft }}
        >
          {character.branch.zodiacKo}
        </span>
      </div>
    </div>
  );
}
