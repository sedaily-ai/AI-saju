'use client';

import { useLang } from '@/shared/lib/LangContext';
import { SAJU } from '@/shared/ui/sajuTokens';
import type { EraFact } from '../lib/eraFacts';

/**
 * 시대 팩트 카드 — "사주 위에 얹는 세상의 흐름".
 * ⚠️ 현재 데이터는 예시(placeholder). 카드에 '예시' 배지를 노출한다.
 */
export function EraFactCard({ facts }: { facts: EraFact[] }) {
  const { t, lang } = useLang();
  if (!facts.length) return null;

  return (
    <div className="chat-in-bot mb-2 max-w-[88%] rounded-2xl overflow-hidden" style={{ border: `1px solid ${SAJU.line}`, background: '#fff' }}>
      <div className="flex items-center justify-between px-3.5 py-2.5" style={{ background: SAJU.warmSoft }}>
        <span className="text-[13px] font-bold" style={{ color: SAJU.ink }}>
          📊 {t('지금 시대의 흐름', "Today's currents")}
        </span>
        <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: '#fff', color: SAJU.warmDeep, border: `1px solid ${SAJU.line}` }}>
          {t('예시', 'Sample')}
        </span>
      </div>
      <ul className="px-3.5 py-3 space-y-2.5">
        {facts.map((f, i) => (
          <li key={i} className="flex gap-2">
            <span aria-hidden style={{ color: SAJU.warmDeep }}>·</span>
            <div className="min-w-0">
              <p className="text-[13.5px] leading-snug" style={{ color: SAJU.ink }}>
                {lang === 'en' ? f.en : f.ko}
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: SAJU.inkSub }}>
                {lang === 'en' ? f.sourceEn : f.source}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
