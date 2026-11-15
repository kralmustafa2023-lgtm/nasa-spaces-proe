'use client';

import { Html } from '@react-three/drei';
import Interactables from '@/components/Interactables';
import PathArrows from '@/components/PathArrows';
import { useGameStore } from '@/store/gameStore';
import SceneShell, { BOOTH_POSITION, ConsoleBlocks, ScanBooth } from './SceneShell';

export default function LaunchCenterScan2Scene() {
  const post = useGameStore((state) => state.scans.post);
  const startScan = useGameStore((state) => state.startScan);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const notify = useGameStore((state) => state.notify);

  return (
    <SceneShell scene="launchCenterScan2">
      <ScanBooth />
      <ConsoleBlocks />

      {/* Dynamic Navigational Guidance Arrows */}
      {!post ? (
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
            [-2.0, 0.04, -3.5],
            [0, 0.04, -3.8],
          ]}
          color="#4ade80"
          spacing={1.2}
        />
      )}

      {/* Wall Display: Mission Debriefing */}
      <Html position={[0, 3.8, -8.7]} center distanceFactor={9}>
        <div
          className="wall-screen"
          style={{
            background: '#041624fa',
            borderColor: '#38bdf8',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.25)',
          }}
        >
          <small style={{ color: '#38bdf8' }}>NASA JSC GÖREV KONTROL · GÖREV TAMAMLAMA DEBRİFİNGİ</small>
          {post ? (
            <>
              <strong style={{ color: '#4ade80', fontSize: '13px' }}>
                🎉 GÖREV BAŞARIYLA TAMAMLANDI // MISSION 180 COMPLETED
              </strong>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#cbd5e1' }}>
                Tüm aşamaların biyometrik verileri kaydedildi. Karşılaştırmalı sağlık raporunu ve uçuş doktoru tavsiyelerini konsoldan inceleyebilirsiniz.
              </p>
            </>
          ) : (
            <div>
              <strong style={{ color: '#facc15' }}>SON SAĞLIK TARAMASI BEKLENİYOR</strong>
              <p style={{ margin: '6px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Dünya’ya dönüş sonrası astronot vücut adaptasyonunu ölçmek için soldaki Sağlık Kabini’ne girin.
              </p>
            </div>
          )}
        </div>
      </Html>

      <Interactables
        items={[
          {
            id: 'cabin',
            position: [BOOTH_POSITION[0], 1.2, BOOTH_POSITION[2]],
            radius: 2.4,
            hint: 'SAĞLIK KABİNİ',
            done: !!post,
            color: '#38bdf8',
            label: post
              ? 'Dönüş sonrası son tarama sonuçlarını göster'
              : 'Sağlık Kabinine Gir · Son Taramayı Başlat',
            onUse: () => {
              if (post) {
                useGameStore.setState({ cabinPhase: 'post' });
                setOverlay('cabin');
              } else {
                startScan('post');
              }
            },
          },
          {
            id: 'report',
            position: [0, 1.2, -4.2],
            radius: 2.6,
            hint: 'GÖREV RAPORU',
            locked: !post,
            color: '#4ade80',
            label: 'Önce/Sonra Sağlık Karşılaştırmasını ve Nihai Görev Raporunu Aç',
            onUse: () => {
              if (post) setOverlay('comparison');
              else notify('Nihai rapor için önce Sağlık Kabini’nde son taramayı tamamlayın.');
            },
          },
        ]}
      />
    </SceneShell>
  );
}
