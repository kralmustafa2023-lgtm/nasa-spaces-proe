'use client';

import { Html } from '@react-three/drei';
import ModelLoader from '@/components/ModelLoader';
import Interactables from '@/components/Interactables';
import PathArrows from '@/components/PathArrows';
import { useGameStore } from '@/store/gameStore';
import SceneShell, { BOOTH_POSITION, ConsoleBlocks, ScanBooth } from './SceneShell';

const DOT = { green: '#4ade80', yellow: '#facc15', red: '#f87171' } as const;

export default function LaunchCenterScan1Scene() {
  const baseline = useGameStore((state) => state.scans.baseline);
  const startScan = useGameStore((state) => state.startScan);
  const setScene = useGameStore((state) => state.setScene);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const notify = useGameStore((state) => state.notify);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const isModalOpen = !!activeOverlay || !!activeRepair || wristOpen || hologramOpen;

  const openBaseline = () => {
    useGameStore.setState({ cabinPhase: 'baseline' });
    setOverlay('cabin');
  };

  return (
    <SceneShell scene="launchCenterScan1">
      <ConsoleBlocks />
      <ScanBooth />
      <ModelLoader id="markIIISuit" position={[6.5, 0, -6.5]} />

      {/* Dynamic Navigational Arrows on the floor */}
      {!baseline ? (
        <PathArrows
          points={[
            [0, 0.04, 4.5],
            [-2.0, 0.04, 2.0],
            [-3.8, 0.04, -1.0],
            [-5.5, 0.04, -4.5],
          ]}
          color="#38bdf8"
          spacing={1.4}
        />
      ) : (
        <PathArrows
          points={[
            [-4.5, 0.04, -4.5],
            [-1.0, 0.04, -3.0],
            [2.5, 0.04, -1.0],
            [5.5, 0.04, 0.8],
            [7.0, 0.04, 2.0],
          ]}
          color="#4ade80"
          spacing={1.4}
        />
      )}

      {/* Main Command Wall Screen — always mounted, hidden via CSS when modal open */}
      <Html position={[0, 3.8, -8.7]} center distanceFactor={9}>
        <div
          className="wall-screen"
          style={{
            background: '#041624fa',
            borderColor: '#38bdf8',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
            display: isModalOpen ? 'none' : undefined,
          }}
        >
          <small style={{ color: '#38bdf8' }}>NASA JSC GÖREV KONTROL · ASTRONOT BİYOMETRİ PANOSU</small>
          {baseline ? (
            <>
              <strong style={{ color: DOT[baseline.overallStatus], fontSize: '13px' }}>
                GENEL SAĞLIK DURUMU:{' '}
                {baseline.overallStatus === 'green'
                  ? 'UÇUŞA UYGUN (UÇUŞ İZNİ VERİLDİ)'
                  : baseline.overallStatus === 'yellow'
                  ? 'DİKKATLE İZLENMELİ'
                  : 'YÜKSEK RİSK'}
              </strong>
              <ul style={{ marginTop: '8px' }}>
                {baseline.metrics.map((metric) => (
                  <li key={metric.id}>
                    <i style={{ background: DOT[metric.status] }} />
                    <span>
                      {metric.name}: <strong>{metric.displayValue}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div>
              <strong style={{ color: '#facc15' }}>SAĞLIK VERİSİ BEKLENİYOR</strong>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Fırlatma protokolü gereği önce soldaki Sağlık Kabini&apos;ne girerek biyometrik taramanızı tamamlayın.
              </p>
            </div>
          )}
        </div>
      </Html>

      {/* Exit Door Waypoint — always mounted, hidden via CSS when modal open */}
      <Html position={[7, 2.8, 2]} center distanceFactor={10}>
        <span
          className="scene-tag"
          style={{
            background: baseline ? '#092d1cfa' : '#221114fa',
            borderColor: baseline ? '#4ade80' : '#f87171',
            color: baseline ? '#86efac' : '#fca5a5',
            display: isModalOpen ? 'none' : undefined,
          }}
        >
          {baseline ? '✓ FIRLATMA RAMPASINA ÇIKIŞ AÇIK' : '🔒 RAMPAYA GEÇİŞ KİLİTLİ'}
        </span>
      </Html>

      <Interactables
        items={[
          {
            id: 'cabin',
            position: [BOOTH_POSITION[0], 1.2, BOOTH_POSITION[2]],
            radius: 2.4,
            hint: 'SAĞLIK KABİNİ',
            done: !!baseline,
            color: '#38bdf8',
            label: baseline
              ? 'Başlangıç sağlık telemetrisini göster'
              : 'Sağlık Kabinine Gir · Başlangıç Taramasını Başlat',
            onUse: () => (baseline ? openBaseline() : startScan('baseline')),
          },
          {
            id: 'panel',
            position: [0, 1.2, -6.8],
            radius: 2.4,
            hint: 'TELEMETRİ MASASI',
            locked: !baseline,
            color: '#38bdf8',
            label: 'Detaylı Kontrol Paneli Sağlık Raporunu Aç',
            onUse: () =>
              baseline
                ? openBaseline()
                : notify("Kontrol masasında henüz veri yok. Önce Sağlık Kabini'nde taranmalısınız."),
          },
          {
            id: 'exitToPad',
            position: [7, 1.2, 2],
            radius: 2.5,
            locked: !baseline,
            color: '#facc15',
            hint: 'ÇIKIŞ KAPISI',
            label: baseline
              ? 'Merkez Binadan Çık (Fırlatma Rampasına ve Merdivenlere İlerle)'
              : 'Fırlatma Rampası Çıkışı (Önce Sağlık Taraması Yapılmalı)',
            onUse: () => {
              if (baseline) {
                setScene('intro');
                notify('Merkez binadan çıktınız. Fırlatma rampasındaki merdivenleri tırmanın ve mekiğe binin.');
              } else {
                notify("Uçuş izni olmadan çıkış yapılamaz! Önce Sağlık Kabini'nde taramayı tamamlayın.");
              }
            },
          },
        ]}
      />
    </SceneShell>
  );
}
