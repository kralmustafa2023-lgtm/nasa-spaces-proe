'use client';

import { useEffect, useRef } from 'react';
import type { HealthScan } from '@/lib/health/types';
import { useGameStore } from '@/store/gameStore';
import SimulationNotice from './SimulationNotice';
import StatusBadge from './StatusBadge';

const phases = [
  ['baseline', 'Başlangıç'],
  ['orbit', 'Yörünge'],
  ['post', 'Dönüş'],
] as const;

export default function WristTablet() {
  const open = useGameStore((state) => state.wristOpen);
  const toggle = useGameStore((state) => state.toggleWrist);
  const scans = useGameStore((state) => state.scans);
  const days = useGameStore((state) => state.missionDays);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const close = useRef<HTMLButtonElement>(null);
  const latest = scans.post ?? scans.orbit ?? scans.baseline;

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'Tab' || activeOverlay) return;
      event.preventDefault();
      if (event.repeat) return;
      if (document.pointerLockElement) document.exitPointerLock();
      toggle();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [activeOverlay, toggle]);
  useEffect(() => { if (open) close.current?.focus(); }, [open]);

  return <section className={'wrist-tablet ' + (open ? 'is-open' : '')} role="dialog"
    aria-label="Astronot tableti" aria-modal="true" aria-hidden={!open} inert={!open}>
    <div className="tablet-top">
      <div><span className="eyebrow">GÖREV BİLGİSAYARI</span><h2>Astronot tableti</h2></div>
      <button ref={close} onClick={toggle} aria-label="Tableti kapat">Kapat <kbd>Tab</kbd></button>
    </div>
    {latest ? <TabletSummary scan={latest} days={days} scans={scans} /> :
      <div className="tablet-empty"><span className="empty-orbit" aria-hidden="true">＋</span><p>Henüz tarama yapılmadı</p></div>}
    <SimulationNotice />
    <div className="tablet-footer"><span className="status-dot" /> GÖREV / {days} GÜN <span>KİŞİSEL TERMİNAL</span></div>
  </section>;
}

function TabletSummary({ scan, days, scans }: { scan: HealthScan; days: number; scans: ReturnType<typeof useGameStore.getState>['scans'] }) {
  return <div className="tablet-summary">
    <div className="tablet-scan-heading"><span>SON TARAMA / GÜN {scan.missionDay}</span><StatusBadge status={scan.overallStatus} /></div>
    <div className="tablet-metrics">{scan.metrics.map((metric) => <div className="tablet-metric" key={metric.id}>
      <span>{metric.tabletText}</span><StatusBadge status={metric.status} compact />
    </div>)}</div>
    <div className="tablet-trend" aria-label="Tarama geçmişi">
      {phases.map(([phase, label]) => <span className={scans[phase] ? 'has-scan' : ''} key={phase}>
        <i aria-hidden="true">{scans[phase] ? '●' : '○'}</i>{label}{scans[phase] && <small>Gün {scans[phase]!.missionDay}</small>}
      </span>)}
    </div>
  </div>;
}
