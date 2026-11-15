'use client';

import { useMemo, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import ModelLoader from '@/components/ModelLoader';
import { useGameStore } from '@/store/gameStore';

/**
 * Realistic Tiered Evergreen Pine Tree with tapered bark, root flare, and layered needle skirts
 */
function PineTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Root flare */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.35, 0.55, 0.4, 7]} />
        <meshStandardMaterial color="#2d1c0f" roughness={0.95} />
      </mesh>
      {/* Textured tapered trunk */}
      <mesh position={[0, 1.8, 0]}>
        <cylinderGeometry args={[0.18, 0.35, 3.2, 7]} />
        <meshStandardMaterial color="#3b2716" roughness={0.9} />
      </mesh>
      {/* Layer 1: Lowest broad foliage tier */}
      <mesh position={[0, 2.5, 0]}>
        <coneGeometry args={[2.4, 1.8, 7]} />
        <meshStandardMaterial color="#194020" roughness={0.85} />
      </mesh>
      {/* Layer 2: Mid-lower foliage tier (slightly rotated for natural irregularity) */}
      <mesh position={[0, 3.6, 0]} rotation={[0, 0.4, 0]}>
        <coneGeometry args={[1.9, 1.7, 7]} />
        <meshStandardMaterial color="#204f28" roughness={0.82} />
      </mesh>
      {/* Layer 3: Upper foliage tier */}
      <mesh position={[0, 4.6, 0]} rotation={[0, -0.3, 0]}>
        <coneGeometry args={[1.4, 1.6, 7]} />
        <meshStandardMaterial color="#265e31" roughness={0.8} />
      </mesh>
      {/* Layer 4: Crown cone */}
      <mesh position={[0, 5.5, 0]}>
        <coneGeometry args={[0.8, 1.4, 7]} />
        <meshStandardMaterial color="#2f6e3a" roughness={0.78} />
      </mesh>
    </group>
  );
}

/**
 * Realistic Deciduous Broadleaf Oak with branching trunk and organic canopy puffs
 */
function RoundTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk base with root flare */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.38, 0.6, 0.6, 7]} />
        <meshStandardMaterial color="#302013" roughness={0.95} />
      </mesh>
      {/* Main trunk */}
      <mesh position={[0, 1.7, 0]} rotation={[0.04, 0, -0.05]}>
        <cylinderGeometry args={[0.26, 0.38, 2.6, 7]} />
        <meshStandardMaterial color="#3a2717" roughness={0.9} />
      </mesh>
      {/* Left primary branch */}
      <mesh position={[-0.45, 2.8, 0.2]} rotation={[0.4, 0, 0.6]}>
        <cylinderGeometry args={[0.14, 0.22, 1.6, 6]} />
        <meshStandardMaterial color="#3a2717" roughness={0.9} />
      </mesh>
      {/* Right primary branch */}
      <mesh position={[0.45, 2.9, -0.2]} rotation={[-0.3, 0, -0.55]}>
        <cylinderGeometry args={[0.14, 0.22, 1.6, 6]} />
        <meshStandardMaterial color="#3a2717" roughness={0.9} />
      </mesh>

      {/* Canopy Puffs: Organic volume cluster */}
      <mesh position={[0, 4.2, 0]}>
        <sphereGeometry args={[1.6, 8, 7]} />
        <meshStandardMaterial color="#2c692c" roughness={0.8} />
      </mesh>
      <mesh position={[-1.1, 3.6, 0.4]}>
        <sphereGeometry args={[1.3, 8, 7]} />
        <meshStandardMaterial color="#337833" roughness={0.82} />
      </mesh>
      <mesh position={[1.1, 3.7, -0.3]}>
        <sphereGeometry args={[1.35, 8, 7]} />
        <meshStandardMaterial color="#255e25" roughness={0.78} />
      </mesh>
      <mesh position={[0.2, 4.8, 0.3]}>
        <sphereGeometry args={[1.1, 7, 6]} />
        <meshStandardMaterial color="#3d873d" roughness={0.75} />
      </mesh>
      <mesh position={[-0.3, 3.4, -0.9]}>
        <sphereGeometry args={[1.15, 7, 6]} />
        <meshStandardMaterial color="#2a632a" roughness={0.82} />
      </mesh>
    </group>
  );
}

/**
 * Pathway Streetlamp (Emissive without heavy dynamic point lights)
 */
function StreetLamp({ position, rotation = [0, 0, 0] }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[0.07, 0.1, 5, 6]} />
        <meshStandardMaterial color="#22303c" metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0.4, 4.9, 0]} rotation={[0, 0, -0.4]}>
        <boxGeometry args={[0.8, 0.12, 0.3]} />
        <meshStandardMaterial color="#1a2530" metalness={0.7} />
      </mesh>
      <mesh position={[0.4, 4.82, 0]}>
        <boxGeometry args={[0.65, 0.04, 0.22]} />
        <meshBasicMaterial color="#fff4d0" />
      </mesh>
    </group>
  );
}

/**
 * Access Stairs & Gantry Bridge leading up to the Shuttle Hatch
 */
function LaunchpadAccessStairs({ hasClearance }: { hasClearance: boolean }) {
  const stepsCount = 10;
  const startZ = -9.0;
  const endZ = -16.5;
  const totalHeight = 4.6;

  return (
    <group position={[28, 0, 0]}>
      {/* 1. Foot of the Stairs: Security Access Gate */}
      <group position={[0, 0, startZ]}>
        <mesh position={[-1.8, 1.4, 0]}>
          <boxGeometry args={[0.3, 2.8, 0.3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[1.8, 1.4, 0]}>
          <boxGeometry args={[0.3, 2.8, 0.3]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} />
        </mesh>
        <mesh position={[0, 2.8, 0]}>
          <boxGeometry args={[3.9, 0.2, 0.35]} />
          <meshStandardMaterial color="#0f172a" metalness={0.9} />
        </mesh>

        {/* Sliding Barrier Doors */}
        <mesh position={[hasClearance ? -2.2 : -0.85, 1.2, 0]}>
          <boxGeometry args={[1.6, 2.3, 0.08]} />
          <meshStandardMaterial
            color={hasClearance ? '#0284c7' : '#991b1b'}
            transparent
            opacity={0.85}
          />
        </mesh>
        <mesh position={[hasClearance ? 2.2 : 0.85, 1.2, 0]}>
          <boxGeometry args={[1.6, 2.3, 0.08]} />
          <meshStandardMaterial
            color={hasClearance ? '#0284c7' : '#991b1b'}
            transparent
            opacity={0.85}
          />
        </mesh>
      </group>

      {/* 2. Concrete Stair Steps with Foundation Truss */}
      <mesh
        position={[0, totalHeight / 2 - 0.3, (startZ + endZ) / 2]}
        rotation={[Math.atan2(totalHeight, Math.abs(endZ - startZ)), 0, 0]}
      >
        <boxGeometry args={[3.2, 0.35, Math.hypot(totalHeight, endZ - startZ)]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>
      {/* Steel Support Pillars to the Ground */}
      {[-1.5, 1.5].map((sideX) =>
        [-11, -13.5, -16].map((pz, idx) => {
          const colHeight = ((pz - startZ) / (endZ - startZ)) * totalHeight;
          return (
            <mesh key={`${sideX}-${idx}`} position={[sideX, colHeight / 2, pz]}>
              <cylinderGeometry args={[0.1, 0.1, colHeight, 6]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          );
        })
      )}

      {Array.from({ length: stepsCount }).map((_, i) => {
        const progress = (i + 1) / stepsCount;
        const z = startZ + progress * (endZ - startZ);
        const y = progress * totalHeight - 0.18;
        return (
          <group key={i}>
            <mesh position={[0, y, z]}>
              <boxGeometry args={[3.0, 0.38, 0.8]} />
              <meshStandardMaterial color="#475569" roughness={0.7} />
            </mesh>
            {/* Safety Yellow Railings */}
            <mesh position={[-1.45, y + 0.6, z]}>
              <boxGeometry args={[0.06, 0.8, 0.78]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
            <mesh position={[1.45, y + 0.6, z]}>
              <boxGeometry args={[0.06, 0.8, 0.78]} />
              <meshStandardMaterial color="#eab308" metalness={0.6} />
            </mesh>
          </group>
        );
      })}

      {/* 3. Elevated Gantry Crew Deck & NASA White Room */}
      <group position={[0, totalHeight, -18.5]}>
        <mesh>
          <boxGeometry args={[3.6, 0.25, 4.2]} />
          <meshStandardMaterial color="#334155" metalness={0.7} />
        </mesh>
        <mesh position={[-1.75, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.1, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>
        <mesh position={[1.75, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.1, 4.2]} />
          <meshStandardMaterial color="#eab308" metalness={0.7} />
        </mesh>

        {/* Shuttle White Room Port (Flushed directly to Space Shuttle crew hatch) */}
        <mesh position={[0, 1.4, -2.0]}>
          <boxGeometry args={[3.2, 2.5, 0.25]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* Hatch Door */}
        <mesh position={[0, 1.3, -1.85]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.7, 0.7, 0.1, 16]} />
          <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.6} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Launch Gantry Service Tower (Kırmızı-Beyaz Servis Kulesi)
 * Fully connected to the launch pad, shuttle stack, and crew bridge via heavy industrial swing arms.
 */
function LaunchGantryTower({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Heavy Launch Pad Concrete Foundation */}
      <mesh position={[6.0, 1.5, 0]}>
        <boxGeometry args={[20, 3, 16]} />
        <meshStandardMaterial color="#374151" roughness={0.9} />
      </mesh>
      {/* Flame Deflector Trench beneath rocket */}
      <mesh position={[6.0, 0.8, 0]}>
        <boxGeometry args={[10, 1.8, 12]} />
        <meshStandardMaterial color="#111827" roughness={0.95} />
      </mesh>

      {/* Red & White Steel Lattice Tower (5 tiers) */}
      {[0, 1, 2, 3, 4].map((tier) => {
        const isRed = tier % 2 === 0;
        const y = 3 + tier * 6.5;
        const color = isRed ? '#d32f2f' : '#ffffff';
        return (
          <group key={tier} position={[0, y, 0]}>
            <mesh position={[-2.0, 3.25, -2.0]}>
              <cylinderGeometry args={[0.18, 0.18, 6.5, 5]} />
              <meshStandardMaterial color={color} metalness={0.6} />
            </mesh>
            <mesh position={[2.0, 3.25, -2.0]}>
              <cylinderGeometry args={[0.18, 0.18, 6.5, 5]} />
              <meshStandardMaterial color={color} metalness={0.6} />
            </mesh>
            <mesh position={[-2.0, 3.25, 2.0]}>
              <cylinderGeometry args={[0.18, 0.18, 6.5, 5]} />
              <meshStandardMaterial color={color} metalness={0.6} />
            </mesh>
            <mesh position={[2.0, 3.25, 2.0]}>
              <cylinderGeometry args={[0.18, 0.18, 6.5, 5]} />
              <meshStandardMaterial color={color} metalness={0.6} />
            </mesh>
            {/* Tier Platform Grating */}
            <mesh position={[0, 6.5, 0]}>
              <boxGeometry args={[4.8, 0.25, 4.8]} />
              <meshStandardMaterial color="#37474f" metalness={0.7} />
            </mesh>
          </group>
        );
      })}

      {/* Swing Arm 1: Gaseous Oxygen Vent Arm / Beanie Cap (Connects tower directly to External Tank top) */}
      <mesh position={[3.0, 26, 0]}>
        <boxGeometry args={[6.0, 0.7, 0.7]} />
        <meshStandardMaterial color="#d32f2f" metalness={0.7} />
      </mesh>
      <mesh position={[6.0, 26, 0]}>
        <coneGeometry args={[1.2, 1.4, 12]} />
        <meshStandardMaterial color="#d32f2f" metalness={0.7} />
      </mesh>

      {/* Swing Arm 2: Mid-level Cryogenic Fuel & Umbilical Arm */}
      <mesh position={[3.0, 16, 0]}>
        <boxGeometry args={[6.0, 0.8, 0.9]} />
        <meshStandardMaterial color="#d32f2f" metalness={0.7} />
      </mesh>

      {/* Swing Arm 3: Crew Access Arm (Connects Tower directly to Shuttle White Room Bridge) */}
      <mesh position={[3.0, 4.6, 2.5]}>
        <boxGeometry args={[6.0, 0.9, 1.4]} />
        <meshStandardMaterial color="#d32f2f" metalness={0.7} />
      </mesh>

      {/* Lightning Mast on Tower Top */}
      <mesh position={[0, 39, 0]}>
        <cylinderGeometry args={[0.08, 0.25, 8, 6]} />
        <meshStandardMaterial color="#ffffff" metalness={0.8} />
      </mesh>
    </group>
  );
}

/**
 * Vertical Launch Rocket & Space Shuttle Stack (Tam Birleşik Mekik Sistemi)
 * External Tank, Solid Rocket Boosters, and Shuttle Orbiter fully assembled in launch configuration.
 */
function LaunchRocketVertical({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Orange External Fuel Tank (ET) */}
      <mesh position={[0, 22, -1.0]}>
        <cylinderGeometry args={[3.2, 3.2, 36, 24]} />
        <meshStandardMaterial color="#b3541e" roughness={0.65} />
      </mesh>
      <mesh position={[0, 42, -1.0]}>
        <coneGeometry args={[3.2, 6, 24]} />
        <meshStandardMaterial color="#b3541e" roughness={0.65} />
      </mesh>

      {/* Twin Solid Rocket Boosters (Attached securely to ET sides) */}
      {[-4.6, 4.6].map((x) => (
        <group key={x} position={[x, 19, -1.0]}>
          <mesh>
            <cylinderGeometry args={[1.4, 1.4, 35, 16]} />
            <meshStandardMaterial color="#eaeef2" roughness={0.4} />
          </mesh>
          <mesh position={[0, 19, 0]}>
            <coneGeometry args={[1.4, 3.5, 16]} />
            <meshStandardMaterial color="#eaeef2" roughness={0.4} />
          </mesh>
          {/* Structural Struts connecting SRB to External Tank */}
          <mesh position={[x > 0 ? -1.0 : 1.0, 6, 0]}>
            <boxGeometry args={[1.8, 0.4, 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
          <mesh position={[x > 0 ? -1.0 : 1.0, -6, 0]}>
            <boxGeometry args={[1.8, 0.4, 0.4]} />
            <meshStandardMaterial color="#334155" metalness={0.8} />
          </mesh>
        </group>
      ))}

      {/* Space Shuttle Orbiter (Atlantis) - Mounted on ET front facing the Crew Access Arm */}
      {/* Orbiter Belly mounts flush to ET, nose points straight up into the sky */}
      <group position={[0, 13.5, 4.8]} rotation={[Math.PI / 2, 0, 0]}>
        <ModelLoader id="shuttle" />
      </group>

      {/* Heavy Heavy Duty Orbiter-to-ET Attachment Bipod */}
      <mesh position={[0, 18, 1.8]}>
        <boxGeometry args={[1.6, 0.8, 2.8]} />
        <meshStandardMaterial color="#1f2937" metalness={0.8} />
      </mesh>
    </group>
  );
}

export default function OutdoorEnvironment() {
  const sceneObj = useThree((state) => state.scene);

  useEffect(() => {
    return () => {
      sceneObj.fog = null;
    };
  }, [sceneObj]);

  const scans = useGameStore((state) => state.scans);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const hasClearance = !!scans.baseline;
  const isModalOpen = !!activeOverlay || !!activeRepair || wristOpen || hologramOpen;

  // Optimized tree positions (10 trees instead of 15)
  const treePositions = useMemo<[number, number, number, number][]>(
    () => [
      [-14, 0, -2, 1.2],
      [-18, 0, -8, 1.4],
      [-16, 0, 8, 1.1],
      [-12, 0, 14, 1.0],
      [-25, 0, -16, 1.5],
      [10, 0, 6, 1.1],
      [14, 0, -4, 1.3],
      [16, 0, 12, 1.0],
      [12, 0, 18, 1.2],
      [-6, 0, 20, 1.1],
    ],
    []
  );

  return (
    <group>
      {/* 1. Natural Sky & Fog */}
      <color attach="background" args={['#86bde6']} />
      <fog attach="fog" args={['#a8d2f0', 25, 120]} />

      {/* Directional Sun without heavy real-time shadow map */}
      <directionalLight position={[45, 55, 30]} intensity={2.2} color="#fff8ed" />
      <hemisphereLight args={['#d6edfc', '#415c32', 1.2]} />
      <ambientLight intensity={0.45} />

      {/* 2. Terrain */}
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[85, 85, 0.3, 32]} />
        <meshStandardMaterial color="#2d6128" roughness={0.92} />
      </mesh>

      {/* 3. Main Roads */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 44]} />
        <meshStandardMaterial color="#2a333d" roughness={0.85} />
      </mesh>
      {[-16, -10, -4, 2, 8, 14].map((z) => (
        <mesh key={z} position={[0, 0.04, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.24, 2.8]} />
          <meshBasicMaterial color="#facc15" />
        </mesh>
      ))}

      <mesh position={[14, 0.02, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[26, 6]} />
        <meshStandardMaterial color="#2a333d" roughness={0.85} />
      </mesh>

      <mesh position={[0, 0.03, -15]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[24, 14]} />
        <meshStandardMaterial color="#738290" roughness={0.65} />
      </mesh>

      {/* 4. HQ Building (Merkez Bina) */}
      <group position={[0, 0, -22]}>
        <ModelLoader id="headquarters" />
        <mesh position={[0, 3.5, 6]}>
          <boxGeometry args={[11, 0.4, 5]} />
          <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 3.4, 6]}>
          <boxGeometry args={[10.6, 0.1, 4.6]} />
          <meshBasicMaterial color="#7dd3fc" transparent opacity={0.6} />
        </mesh>

        {/* Sliding Glass Doors */}
        <mesh position={[-1.6, 1.4, 6.2]}>
          <boxGeometry args={[2.8, 2.6, 0.08]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.65} metalness={0.9} />
        </mesh>
        <mesh position={[1.6, 1.4, 6.2]}>
          <boxGeometry args={[2.8, 2.6, 0.08]} />
          <meshStandardMaterial color="#7dd3fc" transparent opacity={0.65} metalness={0.9} />
        </mesh>

        <Html position={[0, 5.2, 6.2]} center distanceFactor={11}>
          <div className="scene-sign" style={{ background: '#091c2dee', borderColor: '#38bdf8', display: isModalOpen ? 'none' : undefined }}>
            <small style={{ color: '#38bdf8' }}>NASA KENNEDY SPACE CENTER</small>
            <strong style={{ color: '#f8fafc', fontSize: '15px' }}>MERKEZ BİNA · GÖREV KONTROL</strong>
          </div>
        </Html>
      </group>

      {/* 5. VAB in the Backdrop */}
      <group position={[-42, 0, -50]}>
        <ModelLoader id="vab" />
      </group>

      {/* 6. Launch Complex 39A & Access Stairs */}
      <LaunchGantryTower position={[22, 0, -22]} />
      <LaunchRocketVertical position={[28, 2.5, -22]} />
      <LaunchpadAccessStairs hasClearance={hasClearance} />

      {/* 7. Trees */}
      {treePositions.map(([x, y, z, s], i) =>
        i % 2 === 0 ? (
          <PineTree key={i} position={[x, y, z]} scale={s} />
        ) : (
          <RoundTree key={i} position={[x, y, z]} scale={s} />
        )
      )}

      {/* 8. Streetlamps */}
      <StreetLamp position={[-4.2, 0, 4]} rotation={[0, Math.PI / 2, 0]} />
      <StreetLamp position={[4.2, 0, 4]} rotation={[0, -Math.PI / 2, 0]} />
      <StreetLamp position={[-4.2, 0, -6]} rotation={[0, Math.PI / 2, 0]} />
      <StreetLamp position={[4.2, 0, -6]} rotation={[0, -Math.PI / 2, 0]} />

      {/* 9. Waypoint Signs */}
      <Html position={[0, 2.2, -13]} center distanceFactor={10}>
        <div className="scene-tag" style={{ background: '#041624fa', borderColor: '#38bdf8', color: '#e0f2fe', display: isModalOpen ? 'none' : undefined }}>
          🏢 MERKEZ BİNA GİRİŞİ ➔
        </div>
      </Html>
      <Html position={[14, 2.2, -8]} center distanceFactor={10}>
        <div
          className="scene-tag"
          style={{
            background: hasClearance ? '#082518fa' : '#221114fa',
            borderColor: hasClearance ? '#4ade80' : '#facc15',
            color: hasClearance ? '#86efac' : '#fef08a',
            display: isModalOpen ? 'none' : undefined,
          }}
        >
          {hasClearance ? '✓ FIRLATMA RAMPASI AÇIK (MERDİVENLER) ➔' : '🔒 RAMPAYA GEÇİŞ KİLİTLİ ➔'}
        </div>
      </Html>
    </group>
  );
}
