'use client';

import { useCallback, useEffect, useState } from 'react';
import CabinScreen from '@/components/ui/CabinScreen';
import ComparisonScreen from '@/components/ui/ComparisonScreen';
import MissionReportScreen from '@/components/ui/MissionReportScreen';
import WristTablet from '@/components/ui/WristTablet';
import { COUNTERMEASURES, MISSION_DAYS_DEFAULT } from '@/lib/health/config';
import { buildMissionReport } from '@/lib/health/simulate';
import { useGameStore } from '@/store/gameStore';

const scenarios = [
  { id: 'none', label: 'Hiç görev yapma', tasks: [] },
  { id: 'partial', label: 'Kısmi görev (resistanceExercise + sleepRoutine)', tasks: ['resistanceExercise', 'sleepRoutine'] },
  { id: 'all', label: 'Tüm görevler', tasks: COUNTERMEASURES.map((task) => task.id) },
] as const;

export default function UiTestPage() {
  const [scenarioId, setScenarioId] = useState<(typeof scenarios)[number]['id']>('none');
  const days = useGameStore((state) => state.missionDays);
  const completedTasks = useGameStore((state) => state.completedTasks);
  const scans = useGameStore((state) => state.scans);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const report = buildMissionReport(scans, completedTasks, days);

  const refreshScans = useCallback(() => {
    const store = useGameStore.getState();
    store.runScan('baseline');
    store.runScan('orbit');
    store.runScan('post');
  }, []);

  useEffect(() => { refreshScans(); }, [refreshScans, days, completedTasks]);

  const chooseScenario = (id: string) => {
    const selected = scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
    setScenarioId(selected.id);
    useGameStore.setState({ completedTasks: [...selected.tasks] });
  };
  const setDays = (value: number) => useGameStore.setState({ missionDays: value });
  const openOverlay = (overlay: 'cabin' | 'comparison' | 'report') => {
    if (document.pointerLockElement) document.exitPointerLock();
    setOverlay(overlay);
  };
  const toggleTablet = () => {
    if (document.pointerLockElement) document.exitPointerLock();
    useGameStore.getState().toggleWrist();
  };
  const close = () => setOverlay(null);

  return <main className="ui-test-page">
    <header className="ui-test-header">
      <div><span className="health-kicker">MISSION 180 / ARAYÜZ LABORATUVARI</span><h1>Sağlık ekranları</h1></div>
      <label className="scenario-select">Senaryo<select value={scenarioId} onChange={(event) => chooseScenario(event.target.value)}>
        {scenarios.map((scenario) => <option key={scenario.id} value={scenario.id}>{scenario.label}</option>)}
      </select></label>
    </header>
    <section className="ui-test-controls">
      <div className="day-control"><label htmlFor="mission-day">Görev günü <strong>{days}</strong></label>
        <input id="mission-day" type="range" min="30" max="365" step="1" value={days} onChange={(event) => setDays(Number(event.target.value))} />
        <div><span>30</span><span>365</span></div>
      </div>
      <div className="ui-test-actions">
        <button onClick={toggleTablet}>Tableti göster</button>
        <button onClick={() => openOverlay('cabin')}>Kabin ekranını aç (orbit)</button>
        <button onClick={() => openOverlay('comparison')}>Önce/Sonra karşılaştırma</button>
        <button onClick={() => openOverlay('report')}>Görev Raporu</button>
      </div>
    </section>
    <section className="ui-test-status">
      <span>Senaryo: {scenarios.find((item) => item.id === scenarioId)?.label}</span>
      <span>Tamamlanan görev: {completedTasks.length}/{COUNTERMEASURES.length}</span>
      <span>Tarama: {scans.post ? 'Hazır' : 'Hesaplanıyor'}</span>
    </section>
    <div className="ui-test-preview">
      <div className="preview-grid" aria-hidden="true" />
      <div className="preview-copy"><span className="health-kicker">ÖNİZLEME / 2D ARAYÜZ</span><strong>Uzay görevi sağlık simülasyonu</strong><span>Gün {days} / 365</span></div>
      <WristTablet />
    </div>
    {activeOverlay === 'cabin' && scans.orbit && <CabinScreen scan={scans.orbit} onClose={close} />}
    {activeOverlay === 'comparison' && <ComparisonScreen scans={scans} onClose={close} />}
    {activeOverlay === 'report' && <MissionReportScreen report={report} onClose={close} />}
  </main>;
}
