'use client';

import type { Status } from '@/lib/health/types';

const presentation = {
  green: { icon: '✓', label: 'Normal', className: 'status-green' },
  yellow: { icon: '⚠', label: 'Dikkat', className: 'status-yellow' },
  red: { icon: '✖', label: 'Kritik', className: 'status-red' },
} as const;

export default function StatusBadge({ status, compact = false }: { status: Status; compact?: boolean }) {
  const item = presentation[status];
  return <span className={'health-status ' + item.className + (compact ? ' is-compact' : '')} role="status">
    <span aria-hidden="true">{item.icon}</span><span>{item.label}</span>
  </span>;
}
