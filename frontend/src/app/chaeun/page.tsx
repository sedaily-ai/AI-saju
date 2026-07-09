'use client';

import { useEffect, useRef, useState } from 'react';
import {
  buildStructureAnalysis,
  CG_OH,
  OH_HJ,
  REGION_OPTIONS,
  type Pillar,
  type DaeunEntry,
} from '@/features/fortune/lib/engine';
import {
  calculateChaeseongProfile,
  calculateWealthPaths,
  buildMonthWealthSeries,
  computeCurrentPeriodChaeun,
  diagnoseChaeun,
  evaluateDaeunChaeun,
  buildPathPeriodSynergy,
} from '@/features/fortune/lib/engine-chaeun';
import { SajuInputPanel, type SajuCalcResult } from '@/features/fortune/components/SajuInputPanel';
import { WealthNewsSection, SaveProfileButton } from '@/features/fortune';
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

export default function ChaeunPage() {
  const { t, lang, localePath } = useLang();
  const [saju, setSaju] = useState<CurrentSaju | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [isSajuHost, setIsSajuHost] = useState(false);
  const [diagnosisTab, setDiagnosisTab] = useState<'strengths' | 'cautions' | 'attitude' | 'invest' | 'avoid'>('strengths');
  const [expandedDaeunIdx, setExpandedDaeunIdx] = useState<number | null>(null);
  const timelineScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('saju_current');
      if (raw) setSaju(JSON.parse(raw));
    } catch {}
    setLoaded(true);
    if (typeof window !== 'undefined') {
      setIsSajuHost(window.location.hostname === 'saju.sedaily.ai');
    }
  }, []);

  const pillars = saju?.pillars ?? [];
  const ilgan = saju?.ilgan ?? '';
  const daeuns = saju?.daeuns ?? [];
  const year = saju?.year ?? 0;

  const structure = saju ? buildStructureAnalysis(pillars) : null;
  const chaeseong = saju ? calculateChaeseongProfile(pillars) : null;
  const wealthPaths = saju ? calculateWealthPaths(pillars) : null;
  const periodChaeun = saju && ilgan ? computeCurrentPeriodChaeun(ilgan, pillars) : null;
  const monthSeries = saju && ilgan ? buildMonthWealthSeries(ilgan, pillars) : [];
  const diagnosis = structure?.singangyak && chaeseong ? diagnoseChaeun(structure.singangyak, chaeseong, pillars) : null;
  const timeline = saju ? evaluateDaeunChaeun(daeuns, ilgan) : [];

  const now = new Date();
  const currentAge = year > 0 ? now.getFullYear() - year : 0;
  const currentIdx = timeline.findIndex(s => currentAge >= s.age && currentAge < s.age + 10);

  useEffect(() => {
    if (currentIdx < 0 || !timelineScrollRef.current) return;
    const offset = currentIdx * 66; // card 62 + gap 4
    timelineScrollRef.current.scrollTo({ left: Math.max(0, offset - 30), behavior: 'auto' });
    setExpandedDaeunIdx(currentIdx);
  }, [currentIdx]);

  const handleCalculated = (r: SajuCalcResult) => {
    setSaju({
      year: r.year, month: r.month, day: r.day, gender: r.gender,
      timeInput: r.timeInput, region: r.region,
      pillars: r.pillars, ilgan: r.ilgan,
      correctedTime: r.correctedTime, daeuns: r.daeuns,
    });
    setFormOpen(false);
  };

  const initialForm = saju ? {
    birthdate: `${saju.year} / ${String(saju.month).padStart(2, '0')} / ${String(saju.day).padStart(2, '0')}`,
    timeInput: saju.timeInput,
    noTime: !saju.timeInput,
    gender: saju.gender as '남' | '여',
    region: saju.region,
  } : undefined;

  if (!loaded) return null;

  const chaeOh = chaeseong?.chaeOh ?? '';
  const total = chaeseong ? (chaeseong.totalCount || 1) : 1;
  const pyeonPct = chaeseong ? (chaeseong.pyeonJae / total) * 100 : 0;
  const jeongPct = chaeseong ? (chaeseong.jeongJae / total) * 100 : 0;

  // 오늘 재운 점수 (hero용)
  const todayScore = periodChaeun?.iljin?.overall.score ?? periodChaeun?.wolun?.overall.score ?? 0;
  const todayTone = periodChaeun?.iljin?.overall.tone ?? periodChaeun?.wolun?.overall.tone ?? 'neutral';
  const todayLabel = periodChaeun?.iljin?.overall.label ?? periodChaeun?.wolun?.overall.label ?? '';

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
            프로필 카드 (saju 페이지와 동일 스타일)
        ═══════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[10px] flex items-center justify-center text-[16px] font-bold shrink-0"
              style={{ background: EL_BG[CG_OH[ilgan] || ''] || '#F2F4F7', color: EL_SOLID[CG_OH[ilgan] || ''] || '#6B7684' }}
            >
              {ilgan || '—'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-bold text-gray-900 dark:text-gray-100 truncate">
                {lang === 'en'
                  ? `${saju.year}-${String(saju.month).padStart(2, '0')}-${String(saju.day).padStart(2, '0')}`
                  : `${saju.year}년 ${saju.month}월 ${saju.day}일`}
                {saju.timeInput && ` ${saju.timeInput}`}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-300 truncate">
                {saju.gender === '남' ? t('남', 'Male') : saju.gender === '여' ? t('여', 'Female') : ''}
                {saju.region && ` · ${REGION_OPTIONS.find(r => r.value === saju.region)?.label || ''}`}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormOpen(true)}
              className="shrink-0 border-none rounded-lg cursor-pointer px-3 py-1.5 text-[12px] font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {t('다시 입력', 'Re-enter')}
            </button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            오늘의 재운 요약 카드
        ═══════════════════════════════════════════ */}
        <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              {diagnosis && (
                <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 mb-2">
                  {diagnosis.type}
                </span>
              )}
              <div className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">
                {t('오늘의 재운', "Today's Wealth")}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[40px] font-extrabold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                {todayScore}
                <span className="text-[14px] font-medium text-gray-400 dark:text-gray-500 ml-0.5">/100</span>
              </div>
              <div className="text-[11px] font-semibold mt-1" style={{
                color: todayTone === 'good' ? '#15803D' : todayTone === 'caution' ? '#C2410C' : '#64748B',
              }}>
                {todayLabel}
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            시기별 재운 — 가로 3칸 요약 + 상세 접힘
        ═══════════════════════════════════════════ */}
        {periodChaeun && (periodChaeun.yeonun || periodChaeun.wolun || periodChaeun.iljin) && (() => {
          type Row = {
            key: 'year' | 'month' | 'day';
            label: string;
            sub: string;
            ganji: string;
            ganjiHanja: string;
            categories: string[];
            score: number;
            tone: 'good' | 'neutral' | 'caution';
            toneLabel: string;
            note: string;
          };
          const rows: Row[] = [];
          if (periodChaeun.yeonun) rows.push({
            key: 'year', label: t('올해', 'Year'), sub: `${periodChaeun.yeonun.year}`,
            ganji: periodChaeun.yeonun.ganji, ganjiHanja: periodChaeun.yeonun.ganjiHanja,
            categories: periodChaeun.yeonun.categories,
            score: periodChaeun.yeonun.overall.score, tone: periodChaeun.yeonun.overall.tone,
            toneLabel: periodChaeun.yeonun.overall.label, note: periodChaeun.yeonun.note,
          });
          if (periodChaeun.wolun) rows.push({
            key: 'month', label: t('이달', 'Month'), sub: `${periodChaeun.wolun.month}${t('월', '')}`,
            ganji: periodChaeun.wolun.ganji, ganjiHanja: periodChaeun.wolun.ganjiHanja,
            categories: periodChaeun.wolun.categories,
            score: periodChaeun.wolun.overall.score, tone: periodChaeun.wolun.overall.tone,
            toneLabel: periodChaeun.wolun.overall.label, note: periodChaeun.wolun.note,
          });
          if (periodChaeun.iljin) rows.push({
            key: 'day', label: t('오늘', 'Today'), sub: periodChaeun.iljin.dateLabel,
            ganji: periodChaeun.iljin.ganji, ganjiHanja: periodChaeun.iljin.ganjiHanja,
            categories: periodChaeun.iljin.categories,
            score: periodChaeun.iljin.overall.score, tone: periodChaeun.iljin.overall.tone,
            toneLabel: periodChaeun.iljin.overall.label, note: periodChaeun.iljin.note,
          });

          const toneColor = (tone: string) =>
            tone === 'good' ? '#166534' : tone === 'caution' ? '#9A3412' : '#475569';
          const toneBg = (tone: string) =>
            tone === 'good' ? '#F0FDF4' : tone === 'caution' ? '#FFF7ED' : '#F8FAFC';

          return (
            <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 sm:p-5 mb-4">
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {t('시기별 흐름', 'Period Flow')}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-400 mb-4">
                {t('세운 · 월운 · 일진', 'Year · Month · Day luck')}
              </div>

              {/* 가로 3칸 요약 카드 */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                {rows.map(r => (
                  <div
                    key={r.key}
                    className="rounded-xl p-3 text-center border"
                    style={{
                      background: toneBg(r.tone),
                      borderColor: r.tone === 'good' ? '#BBF7D0' : r.tone === 'caution' ? '#FED7AA' : '#E2E8F0',
                    }}
                  >
                    <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium mb-1">{r.label}</div>
                    <div className="text-[22px] font-black leading-none mb-1" style={{ color: toneColor(r.tone) }}>
                      {r.score}
                    </div>
                    <div className="text-[10px] font-medium" style={{ color: toneColor(r.tone) }}>
                      {r.toneLabel}
                    </div>
                    <div className="text-[12px] font-bold text-gray-800 dark:text-gray-200 mt-1.5">{r.ganji}</div>
                    {r.categories.length > 0 && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1.5">
                        {r.categories.map((c, ci) => (
                          <span key={ci} className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                            style={{ background: `${PATH_COLOR[c]}15`, color: PATH_COLOR[c] }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* 상세 (접힘) */}
              <details className="group">
                <summary className="text-[11px] text-gray-500 dark:text-gray-400 cursor-pointer list-none flex items-center justify-center gap-1 py-2 hover:text-gray-700">
                  <span className="group-open:rotate-90 transition-transform inline-block text-[10px]">▸</span>
                  {t('상세 해석 보기', 'Show details')}
                </summary>
                <div className="space-y-2 mt-2">
                  {rows.map(r => (
                    <div key={r.key} className="rounded-lg p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200">{r.label}</span>
                        <span className="text-[10px] text-gray-400">{r.sub}</span>
                        <span className="text-[10px] text-gray-400 font-mono ml-auto">{r.ganjiHanja}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">{r.note}</p>
                    </div>
                  ))}
                </div>
              </details>
            </div>
          );
        })()}
        {periodChaeun?.iljin && (() => {
          const lotto = periodChaeun.iljin.lotto;
          return (
            <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 sm:p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200">
                  {t('횡재 운', 'Windfall Luck')}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[20px] font-black text-amber-600">{lotto.score}</span>
                  <span className="text-[11px] text-gray-400">/100</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} style={{ fontSize: 14, color: i <= lotto.stars ? '#D97706' : '#CBD5E1' }}>★</span>
                ))}
                <span className="text-[11px] text-gray-600 dark:text-gray-300 ml-2 font-medium">{lotto.label}</span>
              </div>
              <details className="group">
                <summary className="text-[10px] text-gray-400 cursor-pointer list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                  {t('내역 보기', 'Details')}
                </summary>
                <div className="mt-2 space-y-1">
                  {lotto.breakdown.map((b, bi) => (
                    <div key={bi} className="flex items-center gap-2 text-[10px]">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${b.met ? 'bg-amber-500' : 'bg-gray-300'}`} />
                      <span className="text-gray-700 dark:text-gray-300 flex-1">{b.label}</span>
                      <span className={`font-bold tabular-nums ${b.points > 0 ? 'text-emerald-600' : b.points < 0 ? 'text-rose-600' : 'text-gray-400'}`}>
                        {b.points > 0 ? `+${b.points}` : b.points === 0 ? '·' : b.points}
                      </span>
                    </div>
                  ))}
                </div>
              </details>
              <p className="text-[9px] text-gray-400 mt-2 italic">※ {lotto.disclaimer}</p>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            대운 — /saju/ UnCard 스타일 (탭→상세)
        ═══════════════════════════════════════════ */}
        {timeline.length > 0 && (() => {
          const ratingColor = (r: typeof timeline[number]['rating']) =>
            r === 'strong' ? '#2D7A1F' : r === 'caution' ? '#C33A1F' : '#64748B';

          return (
            <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-5 mb-4">
              <div className="text-[14px] font-bold text-gray-900 dark:text-gray-100">
                {t('대운', 'Major Cycle')}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-300 mt-0.5 mb-3">
                {t('10년 주기로 보는 큰 흐름', '10-year major life cycles')}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-400 mb-2.5 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
                  <path d="M15 15l-2 5L9 9l11 4-5 2z" />
                </svg>
                {t('각 시기를 탭하면 상세 풀이를 볼 수 있어요', 'Tap a period to see detailed interpretation')}
              </div>

              <div ref={timelineScrollRef} className="overflow-x-auto -mx-1 px-1">
                <div className="flex gap-2 min-w-max pb-1">
                  {timeline.map((seg, i) => {
                    const isCurrent = currentAge >= seg.age && currentAge < seg.age + 10;
                    const isOpen = expandedDaeunIdx === i;
                    const cHanja = seg.ganjiHanja[0] || '';
                    const jHanja = seg.ganjiHanja[1] || '';
                    const edgeColor = isOpen ? '#3182F6' : isCurrent ? '#3182F6' : ratingColor(seg.rating) + '60';
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setExpandedDaeunIdx(isOpen ? null : i)}
                        className="flex flex-col items-center rounded-[14px] cursor-pointer text-center flex-shrink-0"
                        style={{
                          width: 62,
                          padding: '10px 6px',
                          background: isOpen ? 'var(--accent-blue-bg, #EFF6FF)' : 'var(--v3-panel, #F8FAFC)',
                          border: `2px solid ${edgeColor}`,
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ fontSize: 10, opacity: 0.7 }}>
                          {lang === 'en' ? `${seg.age}` : `${seg.age}세`}
                        </div>
                        <div className="w-full my-1" style={{ fontSize: 16, fontWeight: 800, color: ratingColor(seg.rating) }}>
                          {cHanja}
                        </div>
                        <div className="w-full" style={{ fontSize: 16, fontWeight: 800, color: 'var(--v3-ink, #1E293B)' }}>
                          {jHanja}
                        </div>
                        <div style={{ fontSize: 9, fontWeight: 700, marginTop: 3, color: ratingColor(seg.rating) }}>
                          {seg.theme}
                        </div>
                        {isCurrent && (
                          <div style={{ fontSize: 8, fontWeight: 700, color: '#3182F6', marginTop: 2 }}>
                            {t('현재', 'Now')}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 상세 패널 — 선택한 대운 카드 아래 */}
              {expandedDaeunIdx !== null && (() => {
                const seg = timeline[expandedDaeunIdx];
                const isCurrent = currentAge >= seg.age && currentAge < seg.age + 10;
                const curColor = ratingColor(seg.rating);
                return (
                  <div className="mt-3 p-3.5 rounded-xl text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed" style={{ background: 'var(--v3-panel, #F8FAFC)' }}>
                    <div className="font-semibold text-gray-800 dark:text-gray-100 mb-2">
                      {lang === 'en' ? `Age ${seg.age} – ${seg.age + 9}` : `${seg.age}세 ~ ${seg.age + 9}세`}
                      <span className="text-[11px] text-gray-400 dark:text-gray-300 ml-1.5">
                        ({t('10년 기간', '10-year period')})
                      </span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">
                          {t('현재 구간', 'Current')}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[16px] font-extrabold">{seg.ganji}</span>
                      <span className="text-[11px] text-gray-400 font-mono">{seg.ganjiHanja}</span>
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: curColor }}>
                        {seg.theme}
                      </span>
                    </div>

                    {seg.note && <p className="mb-2">{seg.note}</p>}

                    {seg.actions && seg.actions.length > 0 && (
                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                        <div className="text-[11px] font-bold text-gray-700 dark:text-gray-200 mb-1.5 flex items-center gap-1">
                          <span className="inline-block w-1 h-3 rounded-sm" style={{ background: curColor }} />
                          {t('이 10년을 이렇게 쓰세요', 'How to use this decade')}
                        </div>
                        <ul className="space-y-1">
                          {seg.actions.map((a, ai) => (
                            <li key={ai} className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed pl-3 relative">
                              <span className="absolute left-0 top-[6px] w-1 h-1 rounded-full bg-gray-400" />
                              {a}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            6타입 진단 — 탭으로 분리
        ═══════════════════════════════════════════ */}
        {diagnosis && (() => {
          const tabs = [
            { id: 'strengths' as const, label: t('강점', 'Strengths'), items: diagnosis.strengths },
            { id: 'cautions' as const, label: t('주의', 'Caution'), items: diagnosis.cautions },
            { id: 'attitude' as const, label: t('태도', 'Attitude'), items: diagnosis.attitude },
            { id: 'invest' as const, label: t('투자', 'Invest'), items: diagnosis.investmentStyle },
            { id: 'avoid' as const, label: t('금지', 'Avoid'), items: diagnosis.avoid },
          ];
          const activeTab = tabs.find(t => t.id === diagnosisTab) || tabs[0];

          return (
            <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 sm:p-5 mb-4">
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {t('재운 유형', 'Wealth Type')}
              </div>
              <p className="text-[18px] font-extrabold text-gray-900 dark:text-gray-100 mb-1 leading-tight">
                {diagnosis.type}
              </p>
              <p className="text-[12px] text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
                {diagnosis.headline}
              </p>

              {/* 탭 네비게이션 */}
              <div className="flex gap-1 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDiagnosisTab(tab.id)}
                    className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold border-none cursor-pointer transition-colors ${
                      diagnosisTab === tab.id
                        ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 탭 콘텐츠 */}
              <ul className="space-y-2">
                {activeTab.items.map((item, i) => (
                  <li key={i} className="flex gap-2.5 text-[12px] text-gray-700 dark:text-gray-300 leading-relaxed">
                    <span className="shrink-0 w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[10px] font-bold text-gray-500 mt-0.5">
                      {i + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            5경로 — 게이지 중심, 텍스트 최소화
        ═══════════════════════════════════════════ */}
        {wealthPaths && (() => {
          const maxStr = Math.max(...wealthPaths.paths.map(p => p.strength), 1);
          const dom = wealthPaths.dominant;
          return (
            <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 sm:p-5 mb-4">
              <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">
                {t('수익 경로', 'Income Paths')}
              </div>
              <div className="text-[11px] text-gray-400 dark:text-gray-400 mb-4">
                {t('돈이 들어오는 5가지 채널', 'Five channels money flows through')}
              </div>

              {/* 주 경로 하이라이트 */}
              <div className="rounded-xl p-3 mb-4" style={{ background: `${PATH_COLOR[dom.key]}08`, border: `1px solid ${PATH_COLOR[dom.key]}25` }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded text-white" style={{ background: PATH_COLOR[dom.key] }}>
                    {t('주 경로', 'Main')}
                  </span>
                  <span className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{dom.label}</span>
                  <span className="text-[11px] text-gray-400 ml-auto">{dom.strength}/100</span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">{dom.desc}</p>
              </div>

              {/* 전체 5경로 게이지 */}
              <div className="space-y-3">
                {wealthPaths.paths.map((p, i) => {
                  const isDom = i === 0 && p.strength > 0;
                  const barPct = maxStr > 0 ? (p.strength / maxStr) * 100 : 0;
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ background: PATH_COLOR[p.key] }} />
                          <span className={`text-[11px] font-semibold ${isDom ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
                            {p.key} · {p.label}
                          </span>
                        </div>
                        <span className="text-[10px] text-gray-400 tabular-nums">{p.strength}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{
                          width: `${barPct}%`,
                          background: isDom ? PATH_COLOR[p.key] : '#94A3B8',
                        }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* ═══════════════════════════════════════════
            돈 성격 — 편재/정재 비율 바
        ═══════════════════════════════════════════ */}
        {chaeseong && (
          <div className="bg-white dark:bg-gray-900 shadow-[0_1px_4px_rgba(0,0,0,0.06)] border border-gray-100 dark:border-gray-800 rounded-[16px] p-4 sm:p-5 mb-4">
            <div className="text-[13px] font-semibold text-gray-800 dark:text-gray-200 mb-1">
              {t('돈 성격', 'Money Style')}
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-400 mb-4">
              {t('적극형(편재) vs 안정형(정재)', 'Active vs Stable wealth style')}
            </div>

            {chaeseong.totalCount > 0 ? (
              <>
                {/* 비율 바 */}
                <div className="flex items-center justify-between text-[11px] font-bold mb-2">
                  <span style={{ color: '#B45309' }}>{t('적극', 'Active')} {chaeseong.pyeonJae}</span>
                  <span style={{ color: '#0E7490' }}>{t('안정', 'Stable')} {chaeseong.jeongJae}</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden flex mb-3">
                  <div style={{ width: `${pyeonPct}%`, background: '#D97706' }} />
                  <div style={{ width: `${jeongPct}%`, background: '#0891B2' }} />
                </div>
                <p className="text-[12px] text-gray-600 dark:text-gray-300 leading-relaxed">
                  {chaeseong.dominantType === '편재' && t(
                    '큰 돈이 오가는 활동형. 기회를 빠르게 잡되, 여유 자금은 별도로.',
                    'Active type — catches big opportunities fast. Keep reserves separate.'
                  )}
                  {chaeseong.dominantType === '정재' && t(
                    '꾸준히 쌓는 안정형. 장기 투자와 저축이 체질에 맞음.',
                    'Stable type — long-term investing and savings fit your nature.'
                  )}
                  {chaeseong.dominantType === '균형' && t(
                    '공수 균형. 상황에 따라 공격/수비 전환 가능.',
                    'Balanced — can switch between offense and defense as needed.'
                  )}
                </p>
              </>
            ) : (
              <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-relaxed">
                {t('원국에 재성이 없어 편재/정재 구분이 의미 없는 구조예요. 주 경로를 통해 간접적으로 재물이 쌓여요.',
                   'No Wealth axis in chart — money accumulates indirectly through your main path.')}
              </p>
            )}
          </div>
        )}

        {/* 뉴스 + 저장 + 네비게이션 */}
        <WealthNewsSection
          periodChaeun={periodChaeun}
          chaeseong={chaeseong}
          monthSeries={monthSeries}
        />

        <SaveProfileButton
          profile={{
            year: saju.year,
            month: saju.month,
            day: saju.day,
            gender: saju.gender,
            timeInput: saju.timeInput,
            region: saju.region,
            ilgan: saju.ilgan,
            ilganKo: saju.pillars[1]?.ck || '',
          }}
        />

        <button
          type="button"
          onClick={() => {
            if (isSajuHost) { window.location.href = localePath('/'); }
            else { window.location.href = '/?tab=fortune'; }
          }}
          className="w-full mt-4 py-3 text-[13px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 cursor-pointer border-none bg-transparent flex items-center justify-center gap-1.5 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          {t('돌아가기', 'Back')}
        </button>
        </>)}
      </div>

      <BottomNav />
    </PageShell>
  );
}
