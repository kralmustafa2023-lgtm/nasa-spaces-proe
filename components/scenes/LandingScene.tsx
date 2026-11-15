'use client';

import { Html } from '@react-three/drei';
import ModelLoader from '@/components/ModelLoader';
import Interactables from '@/components/Interactables';
import OutdoorEnvironment from '@/components/OutdoorEnvironment';
import PathArrows from '@/components/PathArrows';
import { useGameStore } from '@/store/gameStore';

export default function LandingScene() {
  const setScene = useGameStore((state) => state.setScene);

  return (
    <group>
      {/* Outdoor Spaceport Grounds with Runway, Grass, Trees, HQ, and VAB */}
      <OutdoorEnvironment />

      {/* Navigation Arrows Directing Astronaut into HQ for Final Debriefing & Health Scan */}
      <PathArrows
        points={[
          [0, 0.05, 4.0],
          [0, 0.05, 0],
          [0, 0.05, -5.0],
          [0, 0.05, -10.0],
          [0, 0.05, -14.0],
        ]}
        color="#4ade80"
        spacing={2.0}
      />

      {/* The Landed Space Shuttle Parked on the Runway */}
      <group position={[22, 1.2, -10]} rotation={[0, -Math.PI / 2.8, 0]}>
        <ModelLoader id="shuttle" />
        <Html position={[0, 4.5, 0]} center distanceFactor={10}>
          <div
            className="scene-tag"
            style={{
              background: '#092d1cfa',
              borderColor: '#4ade80',
              color: '#86efac',
              fontWeight: 700,
            }}
          >
            🛬 ATLANTIS MEKİĞİ BAŞARIYLA İNDİ
          </div>
        </Html>
      </group>

      {/* Interactions */}
      <Interactables
        items={[
          {
            id: 'enterHQPost',
            position: [0, 1.2, -14.5],
            radius: 3.4,
            label: 'Merkez Binaya Gir · Son Sağlık Taraması ve Görevi Tamamla',
            hint: 'MERKEZ BİNA',
            color: '#38bdf8',
            onUse: () => setScene('launchCenterScan2'),
          },
        ]}
      />
    </group>
  );
}
