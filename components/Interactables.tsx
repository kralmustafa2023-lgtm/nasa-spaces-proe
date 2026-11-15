'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Group } from 'three';
import { useGameStore } from '@/store/gameStore';

export type Interactable = {
  id: string;
  position: [number, number, number];
  radius?: number;
  label: string;
  /** Marker üstündeki kısa etiket. */
  hint?: string;
  color?: string;
  locked?: boolean;
  done?: boolean;
  onUse: () => void;
};

function Marker({ item, hideLabel }: { item: Interactable; hideLabel: boolean }) {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (!group.current) return;
    group.current.rotation.y = clock.elapsedTime * 1.4;
    group.current.position.y = item.position[1] + Math.sin(clock.elapsedTime * 2 + item.position[0]) * 0.06;
  });

  const color = item.done ? '#4ade80' : item.locked ? '#64748b' : item.color ?? '#22d3ee';

  return (
    <>
      <group ref={group} position={item.position}>
        <mesh>
          <octahedronGeometry args={[0.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
        </mesh>
      </group>
      <mesh position={[item.position[0], 0.02, item.position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 0.55, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} />
      </mesh>
      {item.hint && (
        <Html position={[item.position[0], item.position[1] + 0.55, item.position[2]]} center distanceFactor={9}>
          <span className="scene-tag" style={{ display: hideLabel ? 'none' : 'block' }}>{item.done ? '✓ ' : ''}{item.hint}</span>
        </Html>
      )}
    </>
  );
}

/** E tuşuyla kullanılan etkileşim noktaları. Oyuncu yarıçap içindeyken ekranda ipucu çıkar. */
export default function Interactables({ items }: { items: Interactable[] }) {
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const nearest = useRef<Interactable | null>(null);
  const setPrompt = useGameStore((state) => state.setPrompt);

  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const isModalOpen = !!activeOverlay || !!activeRepair || wristOpen || hologramOpen;

  useFrame(({ camera }) => {
    if (isModalOpen) {
      if (nearest.current) {
        nearest.current = null;
        setPrompt(null);
      }
      return;
    }

    let best: Interactable | null = null;
    let bestDistance = Infinity;
    for (const item of itemsRef.current) {
      if (item.done) continue;
      const distance = Math.hypot(camera.position.x - item.position[0], camera.position.z - item.position[2]);
      if (distance < (item.radius ?? 1.9) && distance < bestDistance) {
        best = item;
        bestDistance = distance;
      }
    }
    const changed = best?.id !== nearest.current?.id || best?.label !== nearest.current?.label;
    nearest.current = best;
    if (changed) setPrompt(best ? best.label : null);
  });

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.code !== 'KeyE' || event.repeat) return;
      const state = useGameStore.getState();
      if (state.activeOverlay || state.activeRepair || state.wristOpen || state.hologramOpen || state.scanning || state.countdown !== null) return;
      nearest.current?.onUse();
    };
    window.addEventListener('keydown', down);
    return () => {
      window.removeEventListener('keydown', down);
      setPrompt(null);
    };
  }, [setPrompt]);

  return (
    <group>
      {items.map((item) => (
        <Marker key={item.id} item={item} hideLabel={isModalOpen} />
      ))}
    </group>
  );
}
