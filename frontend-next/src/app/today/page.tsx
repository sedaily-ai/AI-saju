'use client';

import { useState } from 'react';
import { FortuneTab } from '@/features/fortune/components/FortuneTab';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { useLang } from '@/shared/lib/LangContext';

type MbtiGroup = 'NT' | 'NF' | 'ST' | 'SF';

export default function TodayPage() {
  const [mbtiGroup, setMbtiGroup] = useState<MbtiGroup>('NF');
  const { t } = useLang();

  return (
    <PageShell hanjaRight="日" hanjaLeft="運">
      <PageHeader
        title={t('오늘 운세', "Today")}
        titleAccent={t('세', 'day')}
        sub={t(
          '오늘 일진과 내 사주의 상호작용 · 매일 새로',
          "Today's energy × your chart · refreshed daily",
        )}
      />

      <div className="relative z-10 px-3 mt-3">
        <FortuneTab
          selectedGroup={mbtiGroup}
          onMbtiChange={setMbtiGroup}
          mode="today"
          hideOwnHeader
        />
      </div>

      <BottomNav active="today" />
    </PageShell>
  );
}
