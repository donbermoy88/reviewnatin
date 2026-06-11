'use client';

import { useState, type ReactNode } from 'react';
import { SegTabs } from '@/components/admin-ui';

export function TabSwitch({
  tabs,
  views,
  initial,
  right,
}: {
  tabs: Array<{ id: string; label: string; count?: number }>;
  views: Record<string, ReactNode>;
  initial?: string;
  right?: ReactNode;
}) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
        <SegTabs tabs={tabs} active={active} onChange={setActive} />
        {right}
      </div>
      {views[active]}
    </div>
  );
}
