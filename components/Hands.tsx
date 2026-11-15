'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3, MathUtils } from 'three';
import { useGameStore } from '@/store/gameStore';

/**
 * High-tech Astronaut Suit Arm with Glove and Wrist Telemetry Display
 */
function SpacesuitArm({ isLeft }: { isLeft: boolean }) {
  const side = isLeft ? -1 : 1;

  return (
    <group position={[side * 0.26, -0.26, -0.44]} rotation={[0.25, side * -0.15, side * -0.08]}>
      {/* Forearm Sleeve */}
      <mesh position={[0, 0, 0.12]} rotation={[-0.1, 0, 0]}>
        <cylinderGeometry args={[0.07, 0.085, 0.32, 14]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.65} metalness={0.1} />
      </mesh>

      {/* Accordion Joint Rings */}
      <mesh position={[0, 0, 0.22]}>
        <cylinderGeometry args={[0.086, 0.086, 0.06, 14]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} />
      </mesh>

      {/* NASA Insignia Blue Patch */}
      <mesh position={[side * 0.065, 0.02, 0.12]} rotation={[0, side * (Math.PI / 2), 0]}>
        <planeGeometry args={[0.045, 0.045]} />
        <meshBasicMaterial color="#0284c7" />
      </mesh>

      {/* Wrist Gauntlet Casing */}
      <mesh position={[0, -0.01, -0.06]}>
        <cylinderGeometry args={[0.068, 0.072, 0.1, 14]} />
        <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Embedded OLED Wrist Screen */}
      <mesh position={[0, 0.06, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.065, 0.045]} />
        <meshBasicMaterial color="#0c4a6e" />
      </mesh>
      <mesh position={[0, 0.062, -0.06]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.055, 0.012]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Space Glove Hand */}
      <group position={[0, -0.01, -0.14]}>
        <mesh>
          <boxGeometry args={[0.1, 0.055, 0.09]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[side * -0.05, 0.01, -0.02]} rotation={[0.3, side * 0.4, 0]}>
          <boxGeometry args={[0.032, 0.035, 0.06]} />
          <meshStandardMaterial color="#1e293b" roughness={0.8} />
        </mesh>
        {[-0.032, -0.01, 0.012, 0.034].map((x, idx) => (
          <group key={idx} position={[x, -0.005, -0.06]}>
            <mesh>
              <boxGeometry args={[0.02, 0.032, 0.055]} />
              <meshStandardMaterial color="#1e293b" roughness={0.8} />
            </mesh>
            <mesh position={[0, 0, -0.03]}>
              <boxGeometry args={[0.021, 0.033, 0.015]} />
              <meshStandardMaterial color="#eab308" metalness={0.8} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function Hands() {
  const group = useRef<Group>(null);
  const leftArmGroup = useRef<Group>(null);
  const previous = useRef(new Vector3(0, 1.7, 6));
  const phase = useRef(0);

  const wristOpen = useGameStore((state) => state.wristOpen);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const isModalOpen = wristOpen || !!activeOverlay || !!activeRepair;

  useFrame(({ camera }, delta) => {
    if (!group.current) return;

    group.current.position.copy(camera.position);
    group.current.quaternion.copy(camera.quaternion);

    const moving = camera.position.distanceToSquared(previous.current) > 0.000001;
    previous.current.copy(camera.position);
    phase.current += delta * (moving ? 9.5 : 2.5);

    if (leftArmGroup.current) {
      if (hologramOpen) {
        // Raise arm to chest height in front of view when projecting hologram
        leftArmGroup.current.position.x = MathUtils.damp(leftArmGroup.current.position.x, 0.08, 12, delta);
        leftArmGroup.current.position.y = MathUtils.damp(leftArmGroup.current.position.y, 0.05, 12, delta);
        leftArmGroup.current.position.z = MathUtils.damp(leftArmGroup.current.position.z, 0.04, 12, delta);
        leftArmGroup.current.rotation.x = MathUtils.damp(leftArmGroup.current.rotation.x, 0.45, 12, delta);
        leftArmGroup.current.rotation.y = MathUtils.damp(leftArmGroup.current.rotation.y, 0.35, 12, delta);
      } else {
        leftArmGroup.current.position.x = MathUtils.damp(leftArmGroup.current.position.x, 0, 10, delta);
        leftArmGroup.current.position.y = MathUtils.damp(
          leftArmGroup.current.position.y,
          moving ? Math.sin(phase.current) * 0.012 : 0,
          10,
          delta
        );
        leftArmGroup.current.position.z = MathUtils.damp(leftArmGroup.current.position.z, 0, 10, delta);
        leftArmGroup.current.rotation.x = MathUtils.damp(leftArmGroup.current.rotation.x, 0, 10, delta);
        leftArmGroup.current.rotation.y = MathUtils.damp(leftArmGroup.current.rotation.y, 0, 10, delta);
      }
    }
  });

  if (isModalOpen) return null;

  return (
    <group ref={group}>
      {/* Left Arm & Wrist Device */}
      <group ref={leftArmGroup}>
        <SpacesuitArm isLeft={true} />

        {/* Subtle Wrist Display Glow when Hologram is active (No wireframe cone) */}
        {hologramOpen && (
          <pointLight position={[-0.14, -0.04, -0.45]} color="#38bdf8" intensity={4} distance={1.2} />
        )}
      </group>

      {/* Right Arm */}
      <SpacesuitArm isLeft={false} />
    </group>
  );
}
