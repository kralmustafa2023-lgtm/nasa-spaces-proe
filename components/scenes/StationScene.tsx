'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { PointLight, Group } from 'three';
import ModelLoader from '@/components/ModelLoader';
import Interactables, { type Interactable } from '@/components/Interactables';
import PathArrows from '@/components/PathArrows';
import { COUNTERMEASURES } from '@/lib/health/config';
import { REPAIRS, useGameStore } from '@/store/gameStore';
import SceneShell, { BOOTH_POSITION, ScanBooth } from './SceneShell';

const REPAIR_POSITIONS: Record<string, [number, number, number]> = {
  power: [-7.2, 1.1, 0],
  oxygen: [7.2, 1.1, 0],
  comms: [0, 1.1, -7.2], // In front of the observation window
};

const TASK_POSITIONS: Record<string, [number, number, number]> = {
  resistanceExercise: [5.5, 0.8, 4.5],
  cardioExercise: [2.2, 0.8, 5.5],
  sleepRoutine: [-5, 0.8, 5],
  radiationShelter: [-7.5, 0.8, -7],
  crewCommunication: [4, 0.8, -4.5],
};

/**
 * Exterior Communication Satellite Array in Orbit outside the window
 */
function ExternalOrbitalSatellite({ isFixed }: { isFixed: boolean }) {
  const satGroup = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (satGroup.current) {
      satGroup.current.rotation.y = clock.elapsedTime * 0.04;
      satGroup.current.position.y = 1.8 + Math.sin(clock.elapsedTime * 0.4) * 0.25;
    }
  });

  return (
    <group ref={satGroup} position={[0, 1.8, -17]}>
      {/* Central Satellite Body */}
      <mesh castShadow>
        <boxGeometry args={[1.4, 2.2, 1.4]} />
        <meshStandardMaterial color="#f8fafc" metalness={0.9} roughness={0.15} />
      </mesh>
      {/* Gold Multi-Layer Insulation Foil Panels */}
      <mesh position={[0, 0, 0.72]}>
        <planeGeometry args={[1.2, 2.0]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* High-Gain Parabolic Dish Antenna */}
      <mesh position={[0, 1.4, 0]} rotation={[0.4, 0, 0]}>
        <cylinderGeometry args={[1.5, 0.2, 0.4, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.8, 8]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Dual Solar Array Wings extending outward */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 3.4, 0, 0]}>
          <mesh>
            <boxGeometry args={[4.8, 1.4, 0.06]} />
            <meshStandardMaterial color="#0284c7" roughness={0.2} metalness={0.8} />
          </mesh>
          {/* Truss Support Boom */}
          <mesh position={[side * -2.7, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.05, 0.05, 0.8, 8]} />
            <meshStandardMaterial color="#64748b" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Telemetry Beacon (Red warning if broken, Green if fixed) */}
      <pointLight
        position={[0, 2.2, 0]}
        color={isFixed ? '#4ade80' : '#ef4444'}
        intensity={isFixed ? 15 : 35}
        distance={18}
      />
    </group>
  );
}

/**
 * 3D Malfunction Terminal Marker Stand
 */
function MalfunctionTerminal({
  id,
  position,
  label,
  isFixed,
  hideLabel,
}: {
  id: string;
  position: [number, number, number];
  label: string;
  isFixed: boolean;
  hideLabel: boolean;
}) {
  const pulseRef = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    if (pulseRef.current && !isFixed) {
      pulseRef.current.intensity = 15 + Math.sin(clock.elapsedTime * 6) * 12;
    }
  });

  return (
    <group position={position}>
      {/* Terminal Pedestal */}
      <mesh position={[0, -0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.4, 1.2, 8]} />
        <meshStandardMaterial color="#1a2b3c" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Terminal Display Screen */}
      <mesh position={[0, 0.4, 0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.9, 0.6, 0.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.9} />
      </mesh>
      {/* Screen Face */}
      <mesh position={[0, 0.4, 0.06]} rotation={[-0.3, 0, 0]}>
        <planeGeometry args={[0.82, 0.52]} />
        <meshBasicMaterial color={isFixed ? '#22c55e' : '#ef4444'} />
      </mesh>

      {/* Warning/Status Glow */}
      <pointLight
        ref={pulseRef}
        position={[0, 0.6, 0.3]}
        color={isFixed ? '#4ade80' : '#f87171'}
        intensity={isFixed ? 10 : 25}
        distance={6}
      />

      {/* Always mount Html, hide via CSS to avoid removeChild race condition */}
      <Html position={[0, 1.2, 0]} center distanceFactor={8}>
        <span
          className="scene-tag"
          style={{
            background: isFixed ? '#092d1cfa' : '#221114fa',
            borderColor: isFixed ? '#4ade80' : '#f87171',
            color: isFixed ? '#86efac' : '#fca5a5',
            display: hideLabel ? 'none' : 'block',
          }}
        >
          {isFixed ? `✓ ${label} NOMİNAL` : `⚠ ${label} ARIZALI`}
        </span>
      </Html>
    </group>
  );
}

export default function StationScene() {
  const repairs = useGameStore((state) => state.repairs);
  const openRepair = useGameStore((state) => state.openRepair);
  const completedTasks = useGameStore((state) => state.completedTasks);
  const addTask = useGameStore((state) => state.addTask);
  const scans = useGameStore((state) => state.scans);
  const startScan = useGameStore((state) => state.startScan);
  const setOverlay = useGameStore((state) => state.setOverlay);
  const setScene = useGameStore((state) => state.setScene);
  const notify = useGameStore((state) => state.notify);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const isModalOpen = !!activeOverlay || !!activeRepair || wristOpen || hologramOpen;
  const fixed = repairs.length >= REPAIRS.length;
  const alarmLight = useRef<PointLight>(null);

  useFrame(({ clock }) => {
    if (alarmLight.current) {
      if (!fixed) {
        alarmLight.current.intensity = 18 + Math.sin(clock.elapsedTime * 4) * 12;
      } else {
        alarmLight.current.intensity = 12;
      }
    }
  });

  const items: Interactable[] = [
    ...REPAIRS.map((repair) => ({
      id: 'repair-' + repair.id,
      position: REPAIR_POSITIONS[repair.id],
      radius: 2.4,
      color: '#f87171',
      hint: 'ARIZA // ' + repair.label.toUpperCase(),
      done: repairs.includes(repair.id),
      label: `${repair.label} arıza teşhis ve onarım arayüzünü aç`,
      onUse: () => {
        if (repairs.includes(repair.id)) {
          notify(`${repair.label} zaten başarıyla onarılmış durumda.`);
        } else {
          openRepair(repair.id);
        }
      },
    })),
    ...COUNTERMEASURES.map((task) => ({
      id: 'task-' + task.id,
      position: TASK_POSITIONS[task.id],
      radius: 2.0,
      color: '#a78bfa',
      hint: task.nameTR.toUpperCase(),
      done: completedTasks.includes(task.id),
      label: `${task.nameTR} önlemini uygula`,
      onUse: () => {
        addTask(task.id);
        notify(`${task.nameTR} tamamlandı. ${task.descriptionTR}`);
      },
    })),
    {
      id: 'cabin',
      position: [BOOTH_POSITION[0], 1.2, BOOTH_POSITION[2]],
      radius: 2.4,
      hint: 'SAĞLIK KABİNİ',
      locked: !fixed,
      color: '#38bdf8',
      label: scans.orbit
        ? 'Yörünge biyometrik sağlık sonuçlarını yeniden göster'
        : 'Sağlık Kabinine Gir · Yörünge Taramasını Başlat',
      onUse: () => {
        if (!fixed) {
          return notify(
            `Kabin devre dışı: Güç ve yaşam destek sistemlerini onarmanız gerekiyor (${repairs.length}/${REPAIRS.length} tamamlandı).`
          );
        }
        if (scans.orbit) {
          useGameStore.setState({ cabinPhase: 'orbit' });
          setOverlay('cabin');
        } else {
          startScan('orbit');
        }
      },
    },
    {
      id: 'return',
      position: [7, 1.2, -6],
      radius: 2.4,
      color: '#facc15',
      hint: 'DÖNÜŞ KOKPİTİ',
      locked: !scans.orbit,
      label: scans.orbit
        ? 'Dünya’ya Dönüş Mekiğine Bin (İniş Kokpiti)'
        : 'Dönüş Mekiği Kilitli (Önce Yörünge Sağlık Taraması Yapılmalı)',
      onUse: () => {
        if (scans.orbit) {
          useGameStore.getState().setCockpitMode('descent');
          setScene('shuttleCockpit');
          notify('Mekik kokpitine geçildi. Atmosfere giriş ve Dünya iniş sekansını başlatın.');
        } else {
          notify('Dünya’ya dönüşten önce yörünge sağlık taramasını tamamlamalısınız.');
        }
      },
    },
  ];

  return (
    <SceneShell scene="station" window>
      {/* Ambient station lighting: Red pulsing emergency when broken, bright clean white when nominal */}
      <pointLight
        ref={alarmLight}
        position={[0, 4.2, 0]}
        intensity={fixed ? 50 : 35}
        color={fixed ? '#ffffff' : '#ef4444'}
        distance={22}
      />
      <ambientLight intensity={fixed ? 0.75 : 0.45} />

      <ScanBooth />
      <ModelLoader id="issInternal" />

      {/* External Communication Satellite Array in Orbit OUTSIDE the window */}
      <ExternalOrbitalSatellite isFixed={repairs.includes('comms')} />

      {/* Other Astronaut Floating horizontally / tethered on the wall in microgravity */}
      <group position={[7.1, 2.3, 0.6]} rotation={[0.2, -Math.PI / 2, 0.48]}>
        <ModelLoader id="astronaut" />
      </group>

      {/* Dynamic Navigational Guidance Arrows */}
      {!fixed ? (
        !repairs.includes('power') ? (
          <PathArrows points={[[0, 0.04, 2], [-3.2, 0.04, 1.2], [-6.6, 0.04, 0.2]]} color="#f87171" spacing={1.5} />
        ) : !repairs.includes('oxygen') ? (
          <PathArrows points={[[0, 0.04, 2], [3.2, 0.04, 1.2], [6.6, 0.04, 0.2]]} color="#f87171" spacing={1.5} />
        ) : (
          <PathArrows points={[[0, 0.04, 2], [0, 0.04, -2.5], [0, 0.04, -6.6]]} color="#f87171" spacing={1.5} />
        )
      ) : !scans.orbit ? (
        <PathArrows points={[[0, 0.04, 1], [-2.5, 0.04, -2.0], [-5.0, 0.04, -5.0]]} color="#38bdf8" spacing={1.5} />
      ) : (
        <PathArrows points={[[-4.5, 0.04, -4.5], [0, 0.04, -5.2], [4.5, 0.04, -5.6], [6.8, 0.04, -6.0]]} color="#4ade80" spacing={1.4} />
      )}

      {/* 3D Malfunction Terminals */}
      {REPAIRS.map((repair) => (
        <MalfunctionTerminal
          key={repair.id}
          id={repair.id}
          position={REPAIR_POSITIONS[repair.id]}
          label={repair.id === 'comms' ? 'DIŞ UYDU VE HABERLEŞME' : repair.label}
          isFixed={repairs.includes(repair.id)}
          hideLabel={isModalOpen}
        />
      ))}

      <Interactables items={items} />
    </SceneShell>
  );
}
