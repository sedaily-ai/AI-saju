'use client';

import { CharacterGrid } from '@/features/characters';
import { PageShell } from '@/shared/ui/PageShell';
import { PageHeader } from '@/shared/ui/PageHeader';
import { BottomNav } from '@/shared/ui/BottomNav';
import { useLang } from '@/shared/lib/LangContext';

export default function CharacterPage() {
  const { t } = useLang();

  return (
    <PageShell hanjaRight="像" hanjaLeft="干">
      <PageHeader
        title={t('사주 캐릭터', 'Saju Characters')}
        titleAccent={t('캐릭터', 'Characters')}
        sub={t('60갑자로 보는 나의 캐릭터', 'Your character, from the 60 Gapja')}
      />

      <div
        className="relative z-10 mx-3 mt-3 rounded-[28px] px-3 pt-4 pb-5"
        style={{ background: '#F7F5F2' }}
      >
        <CharacterGrid />
      </div>

      <BottomNav active="character" />
    </PageShell>
  );
}
