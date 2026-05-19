'use client';

import { sipsung, unsung, CG_OH, JJ_OH, JJG, type Pillar } from '../lib/engine';
import { useLang } from '@/shared/lib/LangContext';

/* ───────── 오행 → 한자 컬러 ───────── */
const EL_HJ_COLOR: Record<string, string> = {
  목: '#22A05B', // 초록
  화: '#E04A3C', // 빨강
  토: '#D6A042', // 황금
  금: '#6B7684', // 회색
  수: '#3399FF', // 파랑
};

/* ───────── 카드 배경 (무채색 깔끔 톤) ───────── */
const CARD_BG_DEFAULT = '#FFFFFF';
const CARD_BG_DAY = '#F4F5F7'; // 일주(가운데)만 살짝 차이
const CARD_BORDER = '#EEF0F3';
const CARD_BORDER_DAY = '#111111';
const NEUTRAL_TEXT = '#6B7280';
const INK = '#111111';

/* ───────── 한자 → 한글 ───────── */
const CG_HG: Record<string, string> = {
  甲: '갑', 乙: '을', 丙: '병', 丁: '정', 戊: '무',
  己: '기', 庚: '경', 辛: '신', 壬: '임', 癸: '계',
};
const JJ_HG: Record<string, string> = {
  子: '자', 丑: '축', 寅: '인', 卯: '묘', 辰: '진',
  巳: '사', 午: '오', 未: '미', 申: '신', 酉: '유',
  戌: '술', 亥: '해',
};

interface Props {
  pillars: Pillar[];
  ilgan: string;
  /** 본인 이름·성별·생년월일·시간 — 헤더 요약 카드에 반영 */
  summary?: {
    name?: string;
    gender?: string;       // '남' | '여' | ''
    birth?: string;        // 'YYYY.MM.DD'
    time?: string;         // 'HH:MM' 또는 ''
    calendar?: 'solar' | 'lunar';
  };
}

export function SajuTable({ pillars, ilgan, summary }: Props) {
  const { t } = useLang();

  /** 4기둥 컬럼 메타 — 시기 + 의미 라벨 */
  const columns = [
    { ko: '생시', en: 'Hour',  periodKo: '말년운', periodEn: 'Late life',  meaningKo: '자녀운, 결실', meaningEn: 'Children · Outcome' },
    { ko: '생일', en: 'Day',   periodKo: '중년운', periodEn: 'Mid life',   meaningKo: '정체성, 자아', meaningEn: 'Identity · Self'    },
    { ko: '생월', en: 'Month', periodKo: '청년운', periodEn: 'Young life', meaningKo: '부모, 사회상', meaningEn: 'Parents · Society' },
    { ko: '생년', en: 'Year',  periodKo: '초년운', periodEn: 'Early life', meaningKo: '조상, 시대상', meaningEn: 'Ancestors · Era'   },
  ];

  /** 일주명: 일간 한글 + 일지 한글 + 일주 (예: 정해일주) */
  const dayPillar = pillars[1];
  const ilganHj = dayPillar?.c ?? '';
  const iljiHj = dayPillar?.j ?? '';
  const iljuName =
    ilganHj && iljiHj
      ? `${CG_HG[ilganHj] ?? ''}${JJ_HG[iljiHj] ?? ''}${t('일주', ' Pillar')}`
      : '';
  const ilganOh = ilganHj ? CG_OH[ilganHj] : '';
  /** 일간 한자 (오행 컬러로 표시될 큰 뱃지) */
  const ilganBadgeColor = ilganOh ? EL_HJ_COLOR[ilganOh] ?? '#111' : '#111';

  return (
    <section className="mt-7 mb-6">
      {/* ── 섹션 라벨 ── */}
      <SectionLabel>{t('만세력을 토대로 상세하게 분석해요', 'A detailed reading from your full chart')}</SectionLabel>

      {/* ── 요약 카드 (이름/성별/생년월일/시간 + 일주 뱃지) ── */}
      {summary && (
        <div
          className="rounded-[16px] px-5 py-4 mb-5 flex items-center gap-4 border"
          style={{ background: '#FFFFFF', borderColor: CARD_BORDER }}
        >
          <div className="shrink-0 flex flex-col items-center">
            <div
              className="w-[56px] h-[56px] rounded-[12px] flex items-center justify-center border"
              style={{
                background: '#FFFFFF',
                borderColor: CARD_BORDER,
                color: ilganBadgeColor,
                fontWeight: 800,
                fontSize: 28,
              }}
            >
              {ilganHj || '—'}
            </div>
            {iljuName && (
              <div className="text-[11.5px] font-bold mt-1.5" style={{ color: INK }}>
                {iljuName}
              </div>
            )}
          </div>
          <dl className="flex-1 min-w-0 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
            {summary.name && (
              <Row label={t('이름', 'Name')} value={summary.name} />
            )}
            {summary.gender && (
              <Row
                label={t('성별', 'Gender')}
                value={
                  summary.gender === '남' ? t('남성', 'Male')
                    : summary.gender === '여' ? t('여성', 'Female')
                    : summary.gender
                }
              />
            )}
            {summary.birth && (
              <Row
                label={t('생년월일', 'Birth')}
                value={`${summary.birth}${summary.calendar === 'lunar' ? ` (${t('음력', 'Lunar')})` : ` (${t('양력', 'Solar')})`}`}
              />
            )}
            <Row
              label={t('태어난 시간', 'Time')}
              value={summary.time || t('시간 모름', 'Unknown')}
            />
          </dl>
        </div>
      )}

      {/* ── 4기둥 카드 그리드 ── */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {columns.map((col, i) => {
          const p = pillars[i];
          const isDay = i === 1;
          const stemHj = p?.c ?? '';
          const branchHj = p?.j ?? '';
          const stemOh = stemHj ? CG_OH[stemHj] : '';
          const branchOh = branchHj ? JJ_OH[branchHj] : '';
          const stemSipsung = stemHj ? sipsung(ilgan, stemHj) : '';
          const hidden = branchHj ? JJG[branchHj] : null;
          const branchSipsung = hidden ? sipsung(ilgan, hidden[hidden.length - 1]) : '';
          // 12운성은 사용자가 어려워해서 노출 안 함
          void unsung;

          const cardBg = isDay ? CARD_BG_DAY : CARD_BG_DEFAULT;
          const cardBorder = isDay ? CARD_BORDER_DAY : CARD_BORDER;
          const cardBorderWidth = isDay ? 1.5 : 1;

          return (
            <div key={i} className="flex flex-col">
              {/* 헤더 — 컬럼명 / 시기 / 의미 */}
              <div className="text-center mb-2">
                <div className="text-[12.5px] font-extrabold" style={{ color: INK }}>
                  {t(col.ko, col.en)}
                </div>
                <div className="text-[10.5px] mt-0.5" style={{ color: NEUTRAL_TEXT }}>
                  {t(col.periodKo, col.periodEn)}
                </div>
                <div className="text-[10.5px] leading-tight" style={{ color: NEUTRAL_TEXT }}>
                  {t(col.meaningKo, col.meaningEn)}
                </div>
              </div>

              {/* 천간 카드 */}
              <PillarCard
                bg={cardBg}
                border={cardBorder}
                borderWidth={cardBorderWidth}
                topLabel={stemSipsung}
                hj={stemHj}
                hjColor={EL_HJ_COLOR[stemOh] ?? INK}
                bottomLabel={stemHj ? CG_HG[stemHj] ?? '' : ''}
              />
              <div className="h-2 sm:h-2.5" />
              {/* 지지 카드 */}
              <PillarCard
                bg={cardBg}
                border={cardBorder}
                borderWidth={cardBorderWidth}
                topLabel={branchSipsung}
                hj={branchHj}
                hjColor={EL_HJ_COLOR[branchOh] ?? INK}
                bottomLabel={branchHj ? JJ_HG[branchHj] ?? '' : ''}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}

/* ───────── 보조 컴포넌트 ───────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="flex-1 h-px" style={{ background: CARD_BORDER }} />
      <span className="text-[11.5px] font-bold tracking-[0.16em] uppercase" style={{ color: NEUTRAL_TEXT }}>
        {children}
      </span>
      <span className="flex-1 h-px" style={{ background: CARD_BORDER }} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[12px] font-medium" style={{ color: '#9CA3AF' }}>
        {label}
      </dt>
      <dd className="text-[13px] font-semibold truncate" style={{ color: '#111' }}>
        {value}
      </dd>
    </>
  );
}

function PillarCard({
  bg,
  border,
  borderWidth,
  topLabel,
  hj,
  hjColor,
  bottomLabel,
}: {
  bg: string;
  border: string;
  borderWidth: number;
  topLabel?: string;
  hj?: string;
  hjColor: string;
  bottomLabel?: string;
}) {
  return (
    <div
      className="rounded-[14px] py-3 flex flex-col items-center justify-center"
      style={{
        background: bg,
        border: `${borderWidth}px solid ${border}`,
        minHeight: 110,
      }}
    >
      {topLabel ? (
        <div className="text-[11px] font-bold mb-1.5" style={{ color: NEUTRAL_TEXT }}>
          {topLabel}
        </div>
      ) : (
        <div className="text-[11px] mb-1.5">&nbsp;</div>
      )}
      {hj ? (
        <div
          className="leading-none"
          style={{ color: hjColor, fontWeight: 800, fontSize: 32, letterSpacing: '-0.02em' }}
        >
          {hj}
        </div>
      ) : (
        <div className="text-gray-300 text-[24px]">—</div>
      )}
      {bottomLabel ? (
        <div className="text-[11.5px] font-medium mt-1.5" style={{ color: INK }}>
          {bottomLabel}
        </div>
      ) : (
        <div className="text-[11.5px] mt-1.5">&nbsp;</div>
      )}
    </div>
  );
}
