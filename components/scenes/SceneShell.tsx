'use client';

import { Html, Stars } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useEffect, type ReactNode } from 'react';
import type { Mesh } from 'three';
import ModelLoader from '@/components/ModelLoader';
import RealisticEarth from '@/components/RealisticEarth';
import { SCENE_LABELS, useGameStore, type Scene } from '@/store/gameStore';

function Box({
  position,
  size,
  color = '#f1f5f9',
  metalness = 0.2,
  roughness = 0.35,
}: {
  position: [number, number, number];
  size: [number, number, number];
  color?: string;
  metalness?: number;
  roughness?: number;
}) {
  return (
    <mesh position={position} receiveShadow castShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

/**
 * Realistic Space View looking out into Earth orbit
 */
export function SpaceView() {
  return (
    <group>
      {/* Deep-space stars */}
      <Stars radius={100} depth={40} count={1200} factor={3.5} saturation={0.3} fade speed={0.2} />

      {/* Realistic 3D Earth with continents, night city lights, rotating clouds & atmosphere */}
      <RealisticEarth radius={11} position={[0, -1, -28]} rotation={[0.1, 0, 0.41]} spinSpeed={0.03} />

      {/* Sun Light shining on Earth & Spacecraft */}
      <directionalLight position={[-35, 25, -15]} intensity={1.4} color="#fff8e7" />
      <ambientLight intensity={0.25} />

      {/* In-orbit Research Satellites */}
      <ModelLoader id="landsat8" />
      <ModelLoader id="jason1" />
    </group>
  );
}

export const BOOTH_POSITION: [number, number, number] = [-5.5, 0, -3.5];

/**
 * Ultra-Clean High-Tech Medical Diagnostic Scan Pod (Beyaz Temiz Oda Tasarımı)
 */
export function ScanBooth({ position = BOOTH_POSITION }: { position?: [number, number, number] }) {
  const scanning = useGameStore((state) => state.scanning);
  const beam = useRef<Mesh>(null);
  const ring1 = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (beam.current) {
      beam.current.position.y = 1.7 + Math.sin(t * 3.5) * 1.35;
    }
    if (ring1.current) {
      ring1.current.rotation.y = t * 2;
    }
    if (ring2.current) {
      ring2.current.rotation.y = -t * 1.8;
    }
  });

  return (
    <group position={position}>
      {/* Scanning laser beam & light */}
      <mesh ref={beam} visible={scanning !== null}>
        <boxGeometry args={[1.9, 0.08, 1.9]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.85} />
      </mesh>
      {scanning !== null && <pointLight position={[0, 1.8, 0]} intensity={45} color="#38bdf8" distance={7} />}

      {/* Clean White Clinical Pillars */}
      <Box position={[-1.05, 1.65, 0]} size={[0.16, 3.3, 1.8]} color="#f8fafc" metalness={0.4} roughness={0.2} />
      <Box position={[1.05, 1.65, 0]} size={[0.16, 3.3, 1.8]} color="#f8fafc" metalness={0.4} roughness={0.2} />
      {/* Ceiling & Floor Pads */}
      <Box position={[0, 3.32, 0]} size={[2.3, 0.18, 2.1]} color="#0284c7" metalness={0.6} />
      <Box position={[0, 0.08, 0]} size={[2.1, 0.16, 2.1]} color="#f1f5f9" metalness={0.3} roughness={0.2} />

      {/* Holographic scanner rings */}
      <mesh ref={ring1} position={[0, 0.18, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.7, 0.85, 32]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.7} />
      </mesh>
      <mesh ref={ring2} position={[0, 3.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.75, 0.88, 32]} />
        <meshBasicMaterial color="#0284c7" transparent opacity={0.6} />
      </mesh>

      <Html center position={[0, 3.8, 0]} distanceFactor={10}>
        <span className="scene-tag" style={{ background: '#f8fafcee', borderColor: '#0284c7', color: '#0369a1', fontWeight: 700 }}>
          🩺 BİYOMETRİK SAĞLIK KABİNİ
        </span>
      </Html>
    </group>
  );
}

/**
 * Ultra-Professional White NASA Flight Director Consoles & Telemetry Command Banks
 */
export function ConsoleBlocks() {
  return (
    <group>
      {[-4.2, -1.4, 1.4, 4.2].map((x, idx) => (
        <group key={x}>
          {/* Heavy Desk Chassis - Clean NASA White with Anodized Trim */}
          <Box position={[x, 0.55, -5.6]} size={[2.4, 1.1, 1.3]} color="#f8fafc" metalness={0.35} roughness={0.25} />
          {/* Worktop Surface */}
          <Box position={[x, 1.12, -5.4]} size={[2.5, 0.05, 1.4]} color="#e2e8f0" metalness={0.4} roughness={0.2} />

          {/* Dual Multi-Angle Flight Monitors */}
          <group position={[x, 1.58, -5.9]}>
            {/* Monitor 1 (Main Telemetry Display) */}
            <mesh position={[-0.55, 0, 0]} rotation={[0, 0.08, 0]}>
              <boxGeometry args={[1.05, 0.65, 0.06]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
            <mesh position={[-0.55, 0, 0.035]} rotation={[0, 0.08, 0]}>
              <planeGeometry args={[0.98, 0.58]} />
              <meshBasicMaterial color={idx % 2 === 0 ? '#0284c7' : '#059669'} />
            </mesh>

            {/* Monitor 2 (Trajectory & Health Graph) */}
            <mesh position={[0.55, 0, 0]} rotation={[0, -0.08, 0]}>
              <boxGeometry args={[1.05, 0.65, 0.06]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} />
            </mesh>
            <mesh position={[0.55, 0, 0.035]} rotation={[0, -0.08, 0]}>
              <planeGeometry args={[0.98, 0.58]} />
              <meshBasicMaterial color={idx % 2 === 0 ? '#0369a1' : '#0d9488'} />
            </mesh>

            {/* Glowing Status LED Bar on top of each monitor */}
            <mesh position={[-0.55, 0.35, 0]}>
              <boxGeometry args={[0.95, 0.04, 0.04]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
            <mesh position={[0.55, 0.35, 0]}>
              <boxGeometry args={[0.95, 0.04, 0.04]} />
              <meshBasicMaterial color="#38bdf8" />
            </mesh>
          </group>

          {/* Under-desk High-Performance Server Racks */}
          <mesh position={[x, 0.52, -5.6]}>
            <boxGeometry args={[1.6, 0.75, 0.9]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.3} />
          </mesh>
          {/* Server Activity LEDs */}
          {[-0.5, 0, 0.5].map((ledX, ledIdx) => (
            <mesh key={ledIdx} position={[x + ledX, 0.72, -5.12]}>
              <boxGeometry args={[0.08, 0.03, 0.02]} />
              <meshBasicMaterial color={ledIdx === 1 ? '#4ade80' : '#38bdf8'} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

export default function SceneShell({
  scene,
  window = false,
  children,
}: {
  scene: Scene;
  window?: boolean;
  children?: ReactNode;
}) {
  const sceneObj = useThree((state) => state.scene);

  // Clear any lingering outdoor fog so space and interior rooms stay crisp
  useEffect(() => {
    sceneObj.fog = null;
  }, [sceneObj]);

  return (
    <group>
      <color attach="background" args={['#040810']} />

      {/* Bright, Crisp, Ultra-Professional High-Tech Laboratory Lighting */}
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#ffffff', '#cbd5e1', 0.85]} />
      <directionalLight position={[0, 4.8, 0]} intensity={1.2} color="#ffffff" />
      <pointLight position={[0, 4.4, 0]} intensity={50} color="#ffffff" distance={24} />
      <pointLight position={[0, 2.5, -3.5]} intensity={35} color="#e0f2fe" distance={16} />

      {/* High-Tech Polished Epoxy White/Light-Gray Floor */}
      <Box position={[0, -0.15, 0]} size={[18, 0.3, 18]} color="#f1f5f9" metalness={0.2} roughness={0.2} />
      <gridHelper args={[18, 18, '#94a3b8', '#cbd5e1']} position={[0, 0.012, 0]} />

      {/* Modern White NASA Cleanroom Composite Wall Panels */}
      <Box position={[-9, 2.5, 0]} size={[0.3, 5, 18]} color="#f8fafc" metalness={0.2} roughness={0.3} />
      <Box position={[9, 2.5, 0]} size={[0.3, 5, 18]} color="#f8fafc" metalness={0.2} roughness={0.3} />
      <Box position={[0, 2.5, 9]} size={[18, 5, 0.3]} color="#f8fafc" metalness={0.2} roughness={0.3} />
      {/* Ceiling Paneling */}
      <Box position={[0, 5.1, 0]} size={[18, 0.2, 18]} color="#e2e8f0" metalness={0.2} roughness={0.4} />

      {/* Wall Accent Trim Lines (NASA Blue Aero Lines) */}
      <mesh position={[-8.84, 1.4, 0]}>
        <boxGeometry args={[0.04, 0.12, 17.8]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[8.84, 1.4, 0]}>
        <boxGeometry args={[0.04, 0.12, 17.8]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>
      <mesh position={[0, 1.4, 8.84]}>
        <boxGeometry args={[17.8, 0.12, 0.04]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Overhead High-Lumen Daylight LED Diffuser Strip Panels */}
      <mesh position={[-4, 4.95, 0]}>
        <boxGeometry args={[0.6, 0.08, 14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[4, 4.95, 0]}>
        <boxGeometry args={[0.6, 0.08, 14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.8} />
      </mesh>
      <mesh position={[0, 4.95, 0]}>
        <boxGeometry args={[0.6, 0.08, 14]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
      </mesh>

      {/* Front Window or Solid Wall */}
      {window ? (
        <>
          <Box position={[-7.3, 2.5, -9]} size={[3.4, 5, 0.3]} color="#f8fafc" />
          <Box position={[7.3, 2.5, -9]} size={[3.4, 5, 0.3]} color="#f8fafc" />
          <Box position={[0, 0.45, -9]} size={[11.2, 0.9, 0.3]} color="#f8fafc" />
          <Box position={[0, 4.7, -9]} size={[11.2, 0.6, 0.3]} color="#f8fafc" />
          {/* Panoramic Window Mullions (Anodized Aluminum) */}
          <Box position={[-5.6, 2.65, -8.8]} size={[0.1, 3.5, 0.18]} color="#0284c7" />
          <Box position={[5.6, 2.65, -8.8]} size={[0.1, 3.5, 0.18]} color="#0284c7" />
          <Box position={[0, 2.65, -8.8]} size={[0.1, 3.5, 0.18]} color="#0284c7" />
          <SpaceView />
        </>
      ) : (
        <Box position={[0, 2.5, -9]} size={[18, 5, 0.3]} color="#f8fafc" />
      )}

      {/* Location Badge */}
      <Html position={[0, 4.2, -7.5]} center distanceFactor={12}>
        <div className="scene-sign" style={{ background: '#f8fafcee', borderColor: '#0284c7', color: '#0369a1', boxShadow: '0 4px 20px rgba(2, 132, 199, 0.25)' }}>
          <small style={{ color: '#0284c7' }}>{scene}</small>
          <strong style={{ color: '#0f172a' }}>{SCENE_LABELS[scene]}</strong>
        </div>
      </Html>

      {children}
    </group>
  );
}
