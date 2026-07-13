'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildStructureAnalysis,
  CG_OH,
  REGION_OPTIONS,
  type Pillar,
  type DaeunEntry,
} from '@/features/fortune/lib/engine';
import {
  calculateChaeseongProfile,
  calculateWealthPaths,
  computeCurrentPeriodChaeun,
  diagnoseChaeun,
  evaluateDaeunChaeun,
} from '@/features/fortune/lib/engine-chaeun';
import { SajuInputPanel, type SajuCalcResult } from '@/features/fortune/components/SajuInputPanel';
import { SajuTable } from '@/features/fortune/components/SajuTable';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { useLang } from '@/shared/lib/LangContext';

interface CurrentSaju {
  year: number;
  month: number;
  day: number;
  gender: string;
  timeInput: string;
  region: string;
  pillars: Pillar[];
  ilgan: string;
  correctedTime?: { hour: number; minute: number };
  daeuns: DaeunEntry[];
}

const EL_BG: Record<string, string> = {
  '목': '#ECFDF5', '화': '#FEE2E2', '토': '#FEF9C3', '금': '#F5F5F5', '수': '#F3F4F6',
};
const EL_SOLID: Record<string, string> = {
  '목': '#34D399', '화': '#FD0002', '토': '#EDCE01', '금': '#EAEAEA', '수': '#000000',
};
const PATH_COLOR: Record<string, string> = {
  '재성': '#D97706', '인성': '#3182F6', '식상': '#2D7A1F', '관성': '#7C3AED', '비겁': '#C33A1F',
};

// ── 도넛 게이지 SVG 컴포넌트 ──
function DonutGauge({ score, size = 88 }: { score: number; size?: number }) {
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(Math.max(score, 0), 100);
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? '#059669' : pct >= 40 ? '#D97706' : '#DC2626';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2F4F7" strokeWidth={10} />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fontSize={20} fontWeight={800} fill={color}>
        {pct}
      </text>
    </svg>
  );
}

// ── 체크인 선택지 타입 ──
type CheckInChoice = 'invest' | 'transition' | 'flow';

function getCheckInTip(choice: CheckInChoice, diagType: string, currentRating: string): string {
  if (choice === 'invest') {
    if (currentRating === 'strong') return '지금은 재성 에너지가 활발한 구간이에요. 소액부터 실행해보되, 레버리지는 삼가세요.';
    if (currentRating === 'caution') return '수비 구간이에요. 새 투자보다 기존 포지션 점검과 현금 비중 확보가 먼저예요.';
    return '변동이 적은 중립 구간. 공부·리서치에 시간을 쓰고 다음 기회를 준비하세요.';
  }
  if (choice === 'transition') {
    if (diagType === '확장형' || diagType === '기회형') return '당신의 체질은 새로운 도전에 강해요. 다만 이번 달은 준비 기간으로 쓰고, 다음 달 움직여보세요.';
    if (diagType === '관리형') return '안정형 체질이라 큰 변화보다 조직 내 이동·역할 전환이 리스크가 적어요.';
    return '지금 구간의 에너지를 보면, 정보 수집과 네트워킹에 집중하는 게 현명해요.';
  }
  // flow
  if (currentRating === 'strong') return '좋은 흐름이에요. 크게 힘쓰지 않아도 자연스럽게 기회가 보이는 시기예요.';
  if (currentRating === 'caution') return '잠시 숨 고르는 구간이에요. 컨디션 관리와 루틴 정비에 집중하세요.';
  return '평온한 흐름이에요. 일상을 유지하면서 작은 기쁨에 투자해보세요.';
}

export default function ChaeunPage() {
  const { t, lang } = useLang();
  const [saju, setSaju] = useState<CurrentSaju | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [checkInChoice, setCheckInChoice] = useState<CheckInChoice | null>(null);
  const [expandedAct, setExpandedAct] = useState<number | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('saju_current');
      if (raw) setSaju(JSON.parse(raw));
    } catch {}
    setLoaded(true);
  }, []);

  const pillars = saju?.pillars ?? [];
  const ilgan = saju?.ilgan ?? '';
  const daeuns = saju?.daeuns ?? [];
  const year = saju?.year ?? 0;

  const structure = saju ? buildStructureAnalysis(pillars) : null;
  const chaeseong = saju ? calculateChaeseongProfile(pillars) : null;
  const wealthPaths = saju ? calculateWealthPaths(pillars) : null;
  const periodChaeun = saju && ilgan ? computeCurrentPeriodChaeun(ilgan, pillars) : null;
  const diagnosis = structure?.singangyak && chaeseong ? diagnoseChaeun(structure.singangyak, chaeseong, pillars) : null;
  const timeline = saju ? evaluateDaeunChaeun(daeuns, ilgan) : [];

  const now = new Date();
  const currentAge = year > 0 ? now.getFullYear() - year : 0;
  const currentIdx = timeline.findIndex(s => currentAge >= s.age && currentAge < s.age + 10);

  // 대운 3막 그룹핑
  const acts = (() => {
    if (timeline.length === 0) return [];
    const result: { label: string; labelEn: string; segments: typeof timeline; isCurrent: boolean }[] = [];
    const third = Math.ceil(timeline.length / 3);
    const act1 = timeline.slice(0, third);
    const act2 = timeline.slice(third, third * 2);
    const act3 = timeline.slice(third * 2);
    const act1Current = act1.some((s, i) => {
      const idx = i;
      return currentAge >= s.age && currentAge < s.age + 10;
    });
    const act2Current = act2.some((s) => currentAge >= s.age && currentAge < s.age + 10);
    const act3Current = act3.some((s) => currentAge >= s.age && currentAge < s.age + 10);
    if (act1.length) result.push({ label: '1막 · 유년~청년', labelEn: 'Act 1 · Youth', segments: act1, isCurrent: act1Current });
    if (act2.length) result.push({ label: '2막 · 중년', labelEn: 'Act 2 · Middle', segments: act2, isCurrent: act2Current });
    if (act3.length) result.push({ label: '3막 · 확장기', labelEn: 'Act 3 · Expansion', segments: act3, isCurrent: act3Current });
    return result;
  })();

  // 오늘 재운 점수 (hero용)
  const todayScore = periodChaeun?.iljin?.overall.score ?? periodChaeun?.wolun?.overall.score ?? 0;
  const todayTone = periodChaeun?.iljin?.overall.tone ?? periodChaeun?.wolun?.overall.tone ?? 'neutral';
  const todayLabel = periodChaeun?.iljin?.overall.label ?? periodChaeun?.wolun?.overall.label ?? '';

  // 현재 대운 rating
  const currentRating = currentIdx >= 0 ? timeline[currentIdx].rating : 'mixed';

  // 럭키 컬러·아이템 (일간 오행 기반)
  const luckyMap: Record<string, { color: string; colorEn: string; item: string; itemEn: string }> = {
    '목': { color: '초록', colorEn: 'Green', item: '나무 소재 액세서리', itemEn: 'Wooden accessory' },
    '화': { color: '빨강', colorEn: 'Red', item: '캔들·조명', itemEn: 'Candle / Lighting' },
    '토': { color: '노랑', colorEn: 'Yellow', item: '도자기·흙 소재', itemEn: 'Ceramic item' },
    '금': { color: '흰색', colorEn: 'White', item: '금속 반지·시계', itemEn: 'Metal ring / watch' },
    '수': { color: '검정', colorEn: 'Black', item: '수정·유리 소재', itemEn: 'Crystal / glass item' },
  };
  const ilganOh = CG_OH[ilgan] || '목';
  const lucky = luckyMap[ilganOh] || luckyMap['목'];

  const handleCalculated = (r: SajuCalcResult) => {
    setSaju({
      year: r.year, month: r.month, day: r.day, gender: r.gender,
      timeInput: r.timeInput, region: r.region,
      pillars: r.pillars, ilgan: r.ilgan,
      correctedTime: r.correctedTime, daeuns: r.daeuns,
    });
    setFormOpen(false);
    setCheckInChoice(null);
  };

  const initialForm = saju ? {
    birthdate: `${saju.year} / ${String(saju.month).padStart(2, '0')} / ${String(saju.day).padStart(2, '0')}`,
    timeInput: saju.timeInput,
    noTime: !saju.timeInput,
    gender: saju.gender as '남' | '여',
    region: saju.region,
  } : undefined;

  if (!loaded) return null;

  const total = chaeseong ? (chaeseong.totalCount || 1) : 1;
  const pyeonPct = chaeseong ? (chaeseong.pyeonJae / total) * 100 : 0;
  const jeongPct = chaeseong ? (chaeseong.jeongJae / total) * 100 : 0;

  return (
    <PageShell hanjaRight="財" hanjaLeft="富" maxWidth={720}>
      <PageHeader
        title={t('재운', 'Wealth')}
        titleAccent={t('운', 'lth')}
        sub={t('사주 기반 재물 흐름 분석', 'Saju-based wealth flow analysis')}
      />

      <div className="max-w-[480px] lg:max-w-[1080px] mx-auto px-3 sm:px-[14px] pt-4 pb-10">

        {/* 입력 폼 (saju 없을 때) */}
        {!saju && (
          <>
            <p className="mb-4 text-center text-[13px] text-gray-500 dark:text-gray-300 leading-relaxed">
              {lang === 'en' ? (
                <>Enter birth info to see your wealth flow.</>
              ) : (
                <>생년월일을 입력하면 재운 흐름을 분석해드려요.</>
              )}
            </p>
            <SajuInputPanel initial={initialForm} onCalculated={handleCalculated} submitLabel={t('재운 흐름 보기', 'See Wealth Flow')} trackEventName="chaeun_calculate" />
          </>
        )}

        {saju && formOpen && (
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="w-full mb-3 py-2.5 text-[13px] text-gray-500 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 transition-colors border-none cursor-pointer"
            >
              {t('취소', 'Cancel')}
            </button>
            <SajuInputPanel initial={initialForm} onCalculated={handleCalculated} submitLabel={t('재운 흐름 보기', 'See Wealth Flow')} trackEventName="chaeun_calculate" />
          </>
        )}

        {saju && !formOpen && chaeseong && (<>

        {/* ═══════════════════════════════════════════
            프로필 카드
        ═══════════════════════════════════════════ */}
        <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px] font-bold shrink-0"
              style={{ background: EL_BG[CG_OH[ilgan] || ''] || '#F2F4F7', color: EL_SOLID[CG_OH[ilgan] || ''] || '#6B7684' }}
            >
              {ilgan || '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-900 truncate">
                {lang === 'en'
                  ? `${saju.year}-${String(saju.month).padStart(2, '0')}-${String(saju.day).padStart(2, '0')}`
                  : `${saju.year}년 ${saju.month}월 ${saju.day}일`}
                {saju.timeInput && ` ${saju.timeInput}`}
              </div>
              <div className="text-[11px] text-gray-400 truncate">
                {saju.gender === '남' ? t('남', 'Male') : saju.gender === '여' ? t('여', 'Female') : ''}
                {saju.region && ` · ${REGION_OPTIONS.find(r => r.value === saju.region)?.label || ''}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="shrink-0 border-none rounded-lg cursor-pointer px-3 py-1.5 text-[12px] font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              {t('다시 입력', 'Re-enter')}
            </button>
          </div>
        </div>

        {/* 사주 팔자 — 테두리 없이 바로 노출 */}
        <SajuTable pillars={pillars} ilgan={ilgan} />

        {/* ═══════════════════════════════════════════
            ① 재물 유형 카드 — 강조형 (compatibility 스타일)
        ═══════════════════════════════════════════ */}
        {diagnosis && (
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-br from-amber-50 to-orange-50 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-amber-100 p-5 mb-4 mt-6">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-[10.5px] font-bold tracking-[0.12em] text-gray-500 uppercase mb-1">
                  {t('당신의 이상형', 'Your Wealth Type')}
                </div>
                <div className="text-[20px] font-extrabold text-gray-900 leading-[1.3]">
                  {diagnosis.headline}
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-center">
                <div className="text-[11px] font-semibold text-gray-500">{t('재운력', 'Power')}</div>
                <div className="text-[28px] font-black text-gray-900 leading-none mt-0.5">{todayScore}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">/ 100</div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div
                className="w-11 h-11 rounded-[12px] flex items-center justify-center text-[18px] font-bold text-white"
                style={{ background: '#D97706' }}
              >
                {ilgan || '—'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] text-gray-500 font-medium">{t('재물 유형', 'Type')}</div>
                <div className="text-[13px] font-semibold text-gray-800">{diagnosis.type}</div>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {diagnosis.strengths.slice(0, 3).map((s, i) => {
                const keyword = s.split(/[,·—]/)[0].trim().slice(0, 14);
                return (
                  <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-white/70 text-amber-800 border border-amber-200">
                    <span className="text-amber-500">#</span>{keyword}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            ② 오늘의 흐름 — 도넛 게이지 + 코멘트
        ═══════════════════════════════════════════ */}
        <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-5 mb-4">
          <div className="text-[11px] font-medium text-gray-400 mb-3">
            {t('오늘의 흐름', "Today's Flow")}
          </div>
          <div className="flex items-center gap-5">
            <DonutGauge score={todayScore} />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-extrabold text-gray-900 mb-1">
                {todayLabel || t('보통', 'Normal')}
              </div>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                {periodChaeun?.iljin?.note || periodChaeun?.wolun?.note || t(
                  '오늘은 크게 변동 없이 안정적인 흐름이에요.',
                  'A stable flow with no major fluctuation today.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            ③ 인터랙티브 체크인 — 3버튼 선택지
        ═══════════════════════════════════════════ */}
        <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-5 mb-4">
          <div className="text-[13px] font-semibold text-gray-800 mb-3">
            {t('지금 궁금한 건?', "What's on your mind?")}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { id: 'invest' as CheckInChoice, label: t('투자할까 말까', 'Invest?'), icon: '💰' },
              { id: 'transition' as CheckInChoice, label: t('이직·사업 고민', 'Career shift'), icon: '🚀' },
              { id: 'flow' as CheckInChoice, label: t('그냥 흐름만', 'Just flow'), icon: '🌊' },
            ]).map(btn => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCheckInChoice(checkInChoice === btn.id ? null : btn.id)}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center cursor-pointer transition-all ${
                  checkInChoice === btn.id
                    ? 'border-amber-400 bg-amber-50 shadow-sm'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <span className="text-[20px]">{btn.icon}</span>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">{btn.label}</span>
              </button>
            ))}
          </div>
          {checkInChoice && diagnosis && (
            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-[12px] text-amber-800 leading-relaxed">
                {getCheckInTip(checkInChoice, diagnosis.type, currentRating)}
              </p>
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════
            ④ 돈맥 지도 — 수익경로 막대그래프 (재성=주황 통일) + 요약 문장 + 편재/정재 흡수
        ═══════════════════════════════════════════ */}
        {wealthPaths && (() => {
          const maxStr = Math.max(...wealthPaths.paths.map(p => p.strength), 1);
          const dom = wealthPaths.dominant;
          return (
            <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-5 mb-4">
              <div className="text-[13px] font-semibold text-gray-800 mb-1">
                {t('돈맥 지도', 'Money Flow Map')}
              </div>
              <div className="text-[11px] text-gray-400 mb-4">
                {t('돈이 들어오는 5가지 채널', 'Five channels money flows through')}
              </div>

              {/* 요약 문장 */}
              <div className="rounded-xl p-3 mb-4 bg-orange-50 border border-orange-200">
                <p className="text-[12px] font-semibold text-orange-800">
                  {t(
                    `가장 굵은 물줄기는 "${dom.label}"예요`,
                    `Your strongest channel is "${dom.label}"`
                  )}
                </p>
                <p className="text-[11px] text-orange-700 mt-1">{dom.desc}</p>
              </div>

              {/* 막대그래프 — 재성 계열 주황 통일 */}
              <div className="space-y-3">
                {wealthPaths.paths.map((p) => {
                  const barPct = maxStr > 0 ? (p.strength / maxStr) * 100 : 0;
                  const barColor = p.key === '재성' ? '#D97706' : p.key === dom.key ? '#F59E0B' : '#E5A94E';
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-semibold text-gray-700">{p.key} · {p.label}</span>
                        <span className="text-[10px] text-gray-400 tabular-nums">{p.strength}</span>
                      </div>
                      <div className="h-2 rounded-full bg-orange-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${barPct}%`, background: barColor }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 편재/정재 설명 흡수 */}
              {chaeseong && chaeseong.totalCount > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                    <span style={{ color: '#B45309' }}>{t('적극형(편재)', 'Active')} {chaeseong.pyeonJae}</span>
                    <span style={{ color: '#0E7490' }}>{t('안정형(정재)', 'Stable')} {chaeseong.jeongJae}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden flex">
                    <div style={{ width: `${pyeonPct}%`, background: '#D97706' }} className="rounded-l-full" />
                    <div style={{ width: `${jeongPct}%`, background: '#0891B2' }} className="rounded-r-full" />
                  </div>
                  <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                    {chaeseong.dominantType === '편재' && t(
                      '큰 돈이 오가는 활동형. 기회를 빠르게 잡되, 여유 자금은 별도로.',
                      'Active type — catches big opportunities fast.'
                    )}
                    {chaeseong.dominantType === '정재' && t(
                      '꾸준히 쌓는 안정형. 장기 투자와 저축이 체질에 맞아요.',
                      'Stable type — long-term investing fits you.'
                    )}
                    {chaeseong.dominantType === '균형' && t(
                      '공수 균형. 상황에 따라 공격/수비 전환이 자유로워요.',
                      'Balanced — switch between offense and defense freely.'
                    )}
                  </p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            ⑤ 인생 재물 3막 — 대운 그룹핑 (탭→상세 카드 펼침)
        ═══════════════════════════════════════════ */}
        {acts.length > 0 && (
          <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-5 mb-4">
            <div className="text-[13px] font-semibold text-gray-800 mb-1">
              {t('인생 재물 3막', 'Wealth in 3 Acts')}
            </div>
            <div className="text-[11px] text-gray-400 mb-4">
              {t('대운 흐름을 3개 시기로 나눠 봤어요', 'Your major cycles grouped into 3 life phases')}
            </div>

            <div className="space-y-3">
              {acts.map((act, actIdx) => {
                const isOpen = expandedAct === actIdx;
                const ratingColor = (r: string) =>
                  r === 'strong' ? '#2D7A1F' : r === 'caution' ? '#C33A1F' : '#64748B';

                return (
                  <div key={actIdx}>
                    {/* 막 헤더 */}
                    <button
                      type="button"
                      onClick={() => setExpandedAct(isOpen ? null : actIdx)}
                      className={`w-full flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                        act.isCurrent
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-bold text-gray-900">
                          {t(act.label, act.labelEn)}
                        </span>
                        {act.isCurrent && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-600 text-white">
                            {t('지금 여기', 'NOW')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-gray-400">
                          {act.segments[0]?.age}~{act.segments[act.segments.length - 1]?.age + 9}{t('세', '')}
                        </span>
                        <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-90' : ''}`}>▸</span>
                      </div>
                    </button>

                    {/* 펼침 — 대운 상세 카드들 */}
                    {isOpen && (
                      <div className="mt-2 space-y-2 pl-2">
                        {act.segments.map((seg, segIdx) => {
                          const isCurrent = currentAge >= seg.age && currentAge < seg.age + 10;
                          return (
                            <div
                              key={segIdx}
                              className={`rounded-lg p-3 border ${
                                isCurrent ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-gray-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[14px] font-extrabold">{seg.ganji}</span>
                                <span className="text-[10px] text-gray-400 font-mono">{seg.ganjiHanja}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ml-auto"
                                  style={{ background: ratingColor(seg.rating) }}>
                                  {seg.theme}
                                </span>
                                {isCurrent && (
                                  <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                    {t('현재', 'Now')}
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-gray-400 mb-1">
                                {lang === 'en' ? `Age ${seg.age}–${seg.age + 9}` : `${seg.age}세~${seg.age + 9}세`}
                              </div>
                              {seg.note && <p className="text-[11px] text-gray-600 leading-relaxed">{seg.note}</p>}
                              {seg.actions && seg.actions.length > 0 && (
                                <ul className="mt-2 space-y-1">
                                  {seg.actions.slice(0, 2).map((a, ai) => (
                                    <li key={ai} className="text-[10px] text-gray-500 pl-2 relative leading-relaxed">
                                      <span className="absolute left-0 top-[5px] w-1 h-1 rounded-full bg-gray-400" />
                                      {a}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════
            ⑥ 이번 주 돈 처방전 — 체크박스 리스트
        ═══════════════════════════════════════════ */}
        {diagnosis && (
          <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-5 mb-4">
            <div className="text-[13px] font-semibold text-gray-800 mb-3">
              {t('이번 주 돈 처방전', "This Week's Money Rx")}
            </div>

            {/* 해야 할 것 */}
            <div className="space-y-2 mb-3">
              {diagnosis.strengths.slice(0, 2).map((item, i) => (
                <label key={i} className="flex items-start gap-2.5 cursor-pointer group">
                  <input type="checkbox" className="mt-0.5 w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500 accent-amber-600" />
                  <span className="text-[12px] text-gray-700 leading-relaxed group-has-[:checked]:text-gray-400 group-has-[:checked]:line-through transition-colors">
                    {item}
                  </span>
                </label>
              ))}
            </div>

            {/* 하지 말아야 할 것 */}
            <div className="pt-2 border-t border-gray-100">
              {diagnosis.avoid.slice(0, 1).map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="mt-0.5 w-4 h-4 rounded border border-red-200 bg-red-50 flex items-center justify-center text-[10px] text-red-500 font-bold shrink-0">✕</span>
                  <span className="text-[12px] text-red-600 leading-relaxed line-through decoration-red-300">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}



        {/* ═══════════════════════════════════════════
            푸터 — 럭키 컬러/아이템 한 줄
        ═══════════════════════════════════════════ */}
        <div className="bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 rounded-[16px] p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full border-2" style={{
              borderColor: EL_SOLID[ilganOh] || '#D97706',
              background: EL_BG[ilganOh] || '#FEF9C3',
            }} />
            <div>
              <span className="text-[11px] font-bold text-gray-700">
                {t('럭키 컬러', 'Lucky Color')}: {t(lucky.color, lucky.colorEn)}
              </span>
              <span className="text-[11px] text-gray-400 ml-2">
                {t('아이템', 'Item')}: {t(lucky.item, lucky.itemEn)}
              </span>
            </div>
          </div>
        </div>
        </>)}
      </div>

      <BottomNav />
    </PageShell>
  );
}
