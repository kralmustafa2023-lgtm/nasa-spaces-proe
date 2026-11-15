'use client';

import { SCENES, SCENE_LABELS, useGameStore } from '@/store/gameStore';

export default function DebugPanel() {
  const scene = useGameStore((state) => state.scene);
  const setScene = useGameStore((state) => state.setScene);
  const nextScene = useGameStore((state) => state.nextScene);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const runScan = useGameStore((state) => state.runScan);
  const runAllScans = () => {
    runScan('baseline');
    runScan('orbit');
    runScan('post');
  };
  const openOverlay = (overlay: 'cabin' | 'comparison' | 'report') => navigate(() => {
    if (overlay === 'cabin') { runScan('orbit'); useGameStore.setState({ cabinPhase: 'orbit' }); }
    else {
      runAllScans();
    }
    setOverlay(overlay);
  });
  const navigate = (action: () => void) => {
    if (document.pointerLockElement) document.exitPointerLock();
    action();
  };
  return <details className="debug-panel">
    <summary><span className="status-dot" /> SAHNE KONTROLÜ <span>P1 / DEBUG</span></summary>
    <div className="scene-buttons">
      {SCENES.map((id, index) => <button key={id} aria-pressed={scene === id} onClick={() => navigate(() => setScene(id))} title={id}>
        <span>{String(index + 1).padStart(2, '0')}</span>{SCENE_LABELS[id]}
      </button>)}
    </div>
    <button className="next-button" disabled={scene === SCENES.at(-1)} onClick={() => navigate(nextScene)}>Sonraki sahne <span>→</span></button>
    <div className="debug-overlay-actions">
      <button onClick={() => openOverlay('cabin')}>Kabin ekranı</button>
      <button onClick={() => openOverlay('comparison')}>Karşılaştırma</button>
      <button onClick={() => openOverlay('report')}>Görev raporu</button>
    </div>
  </details>;
}
