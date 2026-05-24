'use client';

import { useState } from 'react';
import { FortuneTab } from '@/features/fortune/components/FortuneTab';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { useLang } from '@/shared/lib/LangContext';

type MbtiGroup = 'NT' | 'NF' | 'ST' | 'SF';

export default function SajuStandalonePage() {
  const [mbtiGroup, setMbtiGroup] = useState<MbtiGroup>('NF');
  const { t } = useLang();

  return (
    <PageShell hanjaRight="易" hanjaLeft="命">
      <PageHeader
        title={t('내 사주', 'My Saju')}
        titleAccent={t('주', 'Saju')}
        sub={t(
          '궁통보감·삼명통회·자평진전 3대 고전 · KASI 만세력',
          '3 classical texts · KASI ephemeris',
        )}
      />

      {/* FortuneTab — 자체 헤더 숨김. 폼/결과/cross-link 카드는 그대로 (phase-06 깊이) */}
      <div className="relative z-10 px-3 mt-3">
        <FortuneTab
          selectedGroup={mbtiGroup}
          onMbtiChange={setMbtiGroup}
          hideOwnHeader
        />
      </div>

      <BottomNav active="saju" />
    </PageShell>
  );
}
