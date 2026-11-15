'use client';

import Interactables from '@/components/Interactables';
import OutdoorEnvironment from '@/components/OutdoorEnvironment';
import PathArrows from '@/components/PathArrows';
import { useGameStore } from '@/store/gameStore';

export default function IntroScene() {
  const setScene = useGameStore((state) => state.setScene);
  const notify = useGameStore((state) => state.notify);
  const baseline = useGameStore((state) => state.scans.baseline);
  const hasClearance = !!baseline;

  // Waypoint guidance path points
  const initialGuidancePoints: [number, number, number][] = [
    [0, 0.05, 14],
    [0, 0.05, 8],
    [0, 0.05, 2],
    [0, 0.05, -4],
    [0, 0.05, -9],
    [0, 0.05, -14],
  ];

  const padGuidancePoints: [number, number, number][] = [
    [0, 0.05, -14],
    [8, 0.05, -11.5],
    [18, 0.05, -9.5],
    [28, 0.05, -9.0], // Foot of launchpad stairs
    [28, 1.2, -11.0], // Climbing stairs
    [28, 2.4, -13.0],
    [28, 3.6, -15.0],
    [28, 4.6, -17.0], // Reached upper gantry crew bridge
    [28, 4.6, -20.0], // Shuttle hatch door & White Room
  ];

  return (
    <group>
      {/* Expansive Outdoor NASA Space Center with Grass, Trees, Roads, HQ, VAB, Pad, Stairs */}
      <OutdoorEnvironment />

      {/* Ground Navigation Arrows for Clear Mission Pathfinding */}
      {!hasClearance ? (
        <PathArrows points={initialGuidancePoints} color="#38bdf8" spacing={2.2} />
      ) : (
        <PathArrows points={padGuidancePoints} color="#4ade80" spacing={1.8} />
      )}

      {/* Outdoor Interaction Points */}
      <Interactables
        items={[
          {
            id: 'enterHQ',
            position: [0, 1.2, -14.5],
            radius: 3.4,
            label: hasClearance
              ? 'Merkez Binaya Gir (Tekrar İnceleme)'
              : 'Merkez Binaya Gir · Sağlık Taraması ve Uçuş İzni Al',
            hint: 'MERKEZ BİNA GİRİŞİ',
            color: '#38bdf8',
            done: hasClearance,
            onUse: () => setScene('launchCenterScan1'),
          },
          {
            id: 'launchpadGate',
            position: [28, 1.2, -9.0],
            radius: 3.2,
            locked: !hasClearance,
            color: hasClearance ? '#4ade80' : '#f87171',
            hint: hasClearance ? 'RAMPA AÇIK' : 'KİLİTLİ KAPI',
            label: hasClearance
              ? 'Fırlatma Rampası Güvenlik Kapısı (Açık · Merdivenlere İlerle)'
              : 'Fırlatma Rampası Güvenlik Kapısı (Kilitli)',
            onUse: () => {
              if (hasClearance) {
                notify('Uçuş izniniz onaylandı. Merdivenleri tırmanarak mekik giriş kapağına ilerleyin.');
              } else {
                notify('Yetkisiz Erişim! Önce Merkez Bina’ya girip sağlık taramasını tamamlamalı ve uçuş izni almalısınız.');
              }
            },
          },
          {
            id: 'shuttleHatch',
            position: [28, 5.8, -20.3],
            radius: 3.2,
            locked: !hasClearance,
            color: '#4ade80',
            hint: 'MEKİK KAPAĞI',
            label: hasClearance
              ? 'Mekik Kapısını Aç ve Kokpite Gir'
              : 'Mekik Giriş Kapağı (Uçuş İzni Gerekli)',
            onUse: () => {
              if (hasClearance) {
                setScene('shuttleCockpit');
              } else {
                notify('Fırlatma izni olmadan mekiğe giriş yapılamaz!');
              }
            },
          },
        ]}
      />
    </group>
  );
}
