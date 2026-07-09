'use client';

import { useState } from 'react';
import { FortuneTab } from '@/features/fortune/components/FortuneTab';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { useLang } from '@/shared/lib/LangContext';

type MbtiGroup = 'NT' | 'NF' | 'ST' | 'SF';

export default function SajuChartPage() {
  const [mbtiGroup, setMbtiGroup] = useState<MbtiGroup>('NF');
  const { t } = useLang();

  return (
    <PageShell hanjaRight="易" hanjaLeft="命">
      <PageHeader
        title={t('내 사주 원국', 'My Chart')}
        titleAccent={t('원국', 'Chart')}
        sub={t(
          '궁통보감·삼명통회·자평진전 3대 고전 · KASI 만세력',
          '3 classical texts · KASI ephemeris',
        )}
      />

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
