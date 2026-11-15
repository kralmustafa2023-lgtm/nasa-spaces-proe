'use client';

import { Component, useState, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { REPAIRS, SCENES, SCENE_LABELS, useGameStore, type Scene } from '@/store/gameStore';
import FirstPersonPlayer from './FirstPersonPlayer';
import Hands from './Hands';
import WristTablet from './ui/WristTablet';
import DebugPanel from './ui/DebugPanel';
import CabinScreen from './ui/CabinScreen';
import ComparisonScreen from './ui/ComparisonScreen';
import MissionReportScreen from './ui/MissionReportScreen';
import SurveyScreen from './ui/SurveyScreen';
import RepairModal from './ui/RepairModal';
import HologramHUD from './ui/HologramHUD';
import { buildMissionReport, generateScan } from '@/lib/health/simulate';
import { buildAdvice } from '@/lib/health/advice';
import { ASTRONAUT_PROFILES } from '@/lib/health/astronauts';
import IntroScene from './scenes/IntroScene';
import LaunchCenterScan1Scene from './scenes/LaunchCenterScan1Scene';
import ShuttleCockpitScene from './scenes/ShuttleCockpitScene';
import OrbitScene from './scenes/OrbitScene';
import StationScene from './scenes/StationScene';
import LandingScene from './scenes/LandingScene';
import LaunchCenterScan2Scene from './scenes/LaunchCenterScan2Scene';

const sceneComponents = {
  intro: IntroScene,
  launchCenterScan1: LaunchCenterScan1Scene,
  shuttleCockpit: ShuttleCockpitScene,
  orbit: OrbitScene,
  station: StationScene,
  landing: LandingScene,
  launchCenterScan2: LaunchCenterScan2Scene,
};

const CABIN_TITLES = {
  baseline: 'Kontrol Paneli · Uçuş Öncesi Başlangıç Taraması',
  orbit: 'Tıbbi Kabin · İstasyon Yörünge Taraması',
  post: 'Tıbbi Kabin · Dünya’ya Dönüş Sonrası Tarama',
} as const;

class CanvasBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error) {
    console.warn('[WebGL/Canvas Error]', error);
  }
  render() {
    return this.state.failed ? (
      <div
        className="webgl-fallback"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          height: '100vh',
          background: '#030a14',
          color: '#e2e8f0',
        }}
      >
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#38bdf8' }}>NASA 3B Simülasyon Arayüzü</div>
        <p style={{ color: '#94a3b8', fontSize: '13px' }}>WebGL bağlamı başlatılamadı veya sıfırlandı.</p>
        <button
          onClick={() => this.setState({ failed: false })}
          style={{
            padding: '8px 18px',
            background: '#0284c7',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          Yeniden Dene ⟳
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

type Step = { text: string; done: boolean };

function missionSteps(
  scene: Scene,
  s: { baseline: boolean; orbit: boolean; post: boolean; repairs: string[]; isDescent: boolean }
): Step[] {
  switch (scene) {
    case 'intro':
      return [
        { text: 'Merkez Binaya Gir (Sağlık Taraması ve İzin)', done: s.baseline },
        { text: 'Fırlatma Rampasındaki Merdivenleri Tırman', done: false },
        { text: 'Mekik Kapısını Aç ve Kokpite Gir', done: false },
      ];
    case 'launchCenterScan1':
      return [
        { text: 'Sağlık kabininde taran ve uçuş izni al', done: s.baseline },
        { text: 'Kontrol masasında verileri onayla', done: s.baseline },
        { text: 'Merkezden çıkıp fırlatma rampasına yürü', done: false },
      ];
    case 'shuttleCockpit':
      return [
        {
          text: s.isDescent
            ? 'Retro motorları ateşle ve Dünya inişini başlat'
            : 'Ana motorları ateşle ve fırlatmayı başlat',
          done: false,
        },
      ];
    case 'orbit':
      return [{ text: 'Uzay istasyonuna kenetlen', done: false }];
    case 'station':
      return [
        ...REPAIRS.map((r) => ({
          text: `${r.label} arızasını onar`,
          done: s.repairs.includes(r.id),
        })),
        { text: 'Sağlık kabininde yörünge taraması ve anketini yap', done: s.orbit },
        { text: 'Dünya’ya dönüş mekiğine bin (İniş Kokpiti)', done: false },
      ];
    case 'landing':
      return [{ text: 'Mekikten inip Merkez Binaya dön', done: false }];
    case 'launchCenterScan2':
      return [
        { text: 'Dönüş sonrası son sağlık taramasını yap', done: s.post },
        { text: 'Karşılaştırma ve nihai görev raporunu incele', done: false },
      ];
  }
}

export default function MissionExperience() {
  const scene = useGameStore((state) => state.scene);
  const days = useGameStore((state) => state.missionDays);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const toggleWrist = useGameStore((state) => state.toggleWrist);
  const scans = useGameStore((state) => state.scans);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const completedTasks = useGameStore((state) => state.completedTasks);
  const cabinPhase = useGameStore((state) => state.cabinPhase);
  const repairs = useGameStore((state) => state.repairs);
  const addRepair = useGameStore((state) => state.addRepair);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const closeRepair = useGameStore((state) => state.closeRepair);
  const survey = useGameStore((state) => state.survey);
  const setSurvey = useGameStore((state) => state.setSurvey);
  const prompt = useGameStore((state) => state.prompt);
  const toast = useGameStore((state) => state.toast);
  const notify = useGameStore((state) => state.notify);
  const scanning = useGameStore((state) => state.scanning);
  const countdown = useGameStore((state) => state.countdown);
  const hologramOpen = useGameStore((state) => state.hologramOpen);
  const astronautId = useGameStore((state) => state.astronautId);
  const astronaut = astronautId ? ASTRONAUT_PROFILES[astronautId] : null;
  const [locked, setLocked] = useState(false);

  const cockpitMode = useGameStore((state) => state.cockpitMode);
  const SceneComponent = sceneComponents[scene];
  const index = SCENES.indexOf(scene);
  const steps = missionSteps(scene, {
    baseline: !!scans.baseline,
    orbit: !!scans.orbit,
    post: !!scans.post,
    repairs,
    isDescent: cockpitMode === 'descent',
  });

  const cabinScan = scans[cabinPhase] ?? generateScan(cabinPhase, {
    missionDays: days,
    completedTasks,
    astronautId: astronautId ?? 'veteran',
  });
  const closeCabin = () => setOverlay(cabinPhase === 'post' ? 'comparison' : null);

  const isModalOpen = wristOpen || !!activeOverlay || !!activeRepair;

  return (
    <main className="mission-shell">
      <div className="scene-canvas">
        <CanvasBoundary>
          <Canvas
            camera={{ position: [0, 1.7, 6], fov: 68, near: 0.05, far: 180 }}
            dpr={1}
            gl={{ powerPreference: 'default', antialias: true, failIfMajorPerformanceCaveat: false, preserveDrawingBuffer: false }}
            fallback={<div className="webgl-fallback">Bu tarayıcı WebGL desteklemiyor.</div>}
          >
            <SceneComponent />
            <FirstPersonPlayer onLockChange={setLocked} />
            <Hands />
          </Canvas>
        </CanvasBoundary>
      </div>

      <header className="mission-header">
        <div className="brand-mark">
          M<span>180</span>
        </div>
        <div className="brand-copy">
          <span className="eyebrow">SPACE APPS 2026 // NASA FLIGHT MISSION SIMULATOR</span>
          <h1>İnsan. Uzay. Keşif.</h1>
        </div>
        {astronaut && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(8, 24, 42, 0.85)',
              border: `1.5px solid ${astronaut.badgeColor}88`,
              borderRadius: '24px',
              padding: '6px 14px',
              boxShadow: `0 0 16px ${astronaut.badgeColor}33`,
            }}
          >
            <span style={{ fontSize: '20px', lineHeight: 1 }}>{astronaut.avatarIcon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: astronaut.badgeColor, fontWeight: 800, fontSize: '11px', letterSpacing: '1px' }}>
                  {astronaut.callsign}
                </span>
                <span style={{ color: '#f8fafc', fontWeight: 700, fontSize: '12px' }}>{astronaut.name}</span>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '10px' }}>
                {astronaut.age} Yaş · {astronaut.flightsCompleted} Görev · {astronaut.roleTR.split('(')[0].trim()}
              </span>
            </div>
          </div>
        )}
        <div className="mission-duration">
          <span className="status-dot" />
          <span>
            GÖREV SÜRESİ
            <strong>
              {days} <small>GÜN</small>
            </strong>
          </span>
        </div>
      </header>

      <section className="location-label" aria-live="polite">
        <span className="eyebrow">AŞAMA / {String(index + 1).padStart(2, '0')}</span>
        <h2>{SCENE_LABELS[scene]}</h2>
        <div className="phase-track">
          {SCENES.map((id, i) => (
            <i key={id} className={i <= index ? 'active' : ''} />
          ))}
        </div>
      </section>

      <aside className="objectives" aria-label="Görevler">
        <span className="eyebrow">GÖREV HEDEFLERİ</span>
        <ul>
          {steps.map((step) => (
            <li key={step.text} className={step.done ? 'done' : ''}>
              <i aria-hidden="true">{step.done ? '✓' : '○'}</i>
              {step.text}
            </li>
          ))}
        </ul>
      </aside>

      <div className="crosshair" aria-hidden="true">
        +
      </div>

      {prompt && !scanning && !isModalOpen && (
        <div className="interact-prompt">
          <kbd>E</kbd> {prompt}
        </div>
      )}

      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}

      {scanning && (
        <div className="scan-banner" role="status">
          <span className="eyebrow">BİYOMETRİK SAĞLIK TARAMASI</span>
          <strong>Fizyolojik telemetri taranıyor… lütfen sabit kalın</strong>
          <div className="scan-progress">
            <span />
          </div>
        </div>
      )}

      {countdown !== null && (
        <div className="countdown" role="status">
          <span className="eyebrow">ANA MOTOR ATEŞLEME (T-MINUS)</span>
          <strong>{countdown}</strong>
        </div>
      )}

      <div className="enter-prompt" hidden={locked || isModalOpen}>
        <span className="eyebrow">ASTRONOT BAKIŞ MODU</span>
        <button id="enter-mission">
          🖱️ Fareyi Kilitle ve Çevreye Bak <span>↗</span>
        </button>
        <p>Ekrana Tıkla: Fareyi Kilitle · Fareyi Oynat: Çevreye Bak · WASD: Yürü · Space: Zıpla · Esc: İmleci Serbest Bırak</p>
      </div>

      <DebugPanel />

      <div className="bottom-controls">
        <span>
          <kbd>W A S D</kbd> Hareket
        </span>
        <span>
          <kbd>Space</kbd> Zıpla
        </span>
        <span>
          <kbd>E</kbd> Etkileşim / Onarım
        </span>
        <span>
          <kbd>R</kbd> Bilek Hologramı
        </span>
        <button
          onClick={() => {
            if (document.pointerLockElement) document.exitPointerLock();
            toggleWrist();
          }}
        >
          <kbd>Tab</kbd> Telemetri Tableti
        </button>
      </div>

      <div className="build-label">NASA SPACE APPS // MISSION 180 SIMULATOR</div>

      {/* Futuristic 3D Wrist Holographic Projector HUD (Activated via 'R') */}
      {hologramOpen && !isModalOpen && <HologramHUD scene={scene} steps={steps} />}

      <WristTablet />

      {/* Interactive Step-by-Step Diagnostic & Repair Modal */}
      {activeRepair && (
        <RepairModal
          repairId={activeRepair}
          onComplete={() => {
            addRepair(activeRepair);
            closeRepair();
            notify('Sistem başarıyla onarıldı ve nominal duruma getirildi!');
          }}
          onClose={closeRepair}
        />
      )}

      {activeOverlay === 'survey' && (
        <SurveyScreen
          onSubmit={(answers) => {
            setSurvey(answers);
            setOverlay('cabin');
          }}
        />
      )}

      {activeOverlay === 'cabin' && (
        <CabinScreen
          scan={cabinScan}
          title={CABIN_TITLES[cabinPhase]}
          advice={cabinPhase === 'baseline' ? undefined : buildAdvice(cabinScan, cabinPhase === 'orbit' ? survey : null)}
          onClose={closeCabin}
        />
      )}

      {activeOverlay === 'comparison' && (
        <ComparisonScreen
          scans={scans}
          onClose={() => setOverlay(null)}
          onNext={() => setOverlay('report')}
        />
      )}

      {activeOverlay === 'report' && (
        <MissionReportScreen
          report={buildMissionReport(scans, completedTasks, days)}
          onClose={() => setOverlay(null)}
        />
      )}
    </main>
  );
}
