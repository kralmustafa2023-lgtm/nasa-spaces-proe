'use client';

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PathArrowsProps {
  points: [number, number, number][];
  color?: string;
  spacing?: number;
}

/**
 * High-Realism NASA Tactical Aviation & Spaceport Ground Navigation Markings
 * Features beveled directional chevrons, LED center-line runway indicators,
 * and realistic animated light chase sequences.
 */
export default function PathArrows({ points, color = '#38bdf8', spacing = 2.4 }: PathArrowsProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Compute interpolated waypoints and heading angles along the route
  const markers = useMemo(() => {
    if (points.length < 2) return [];

    const list: { position: [number, number, number]; rotationY: number }[] = [];

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = new THREE.Vector3(...points[i]);
      const p2 = new THREE.Vector3(...points[i + 1]);
      const segmentVec = new THREE.Vector3().subVectors(p2, p1);
      const segmentLength = segmentVec.length();
      const dir = segmentVec.clone().normalize();
      const rotY = Math.atan2(dir.x, dir.z);

      const count = Math.max(1, Math.round(segmentLength / spacing));
      for (let j = 0; j < count; j++) {
        const t = (j + 0.5) / count;
        const pos = new THREE.Vector3().copy(p1).addScaledVector(dir, t * segmentLength);
        list.push({
          position: [pos.x, pos.y, pos.z],
          rotationY: rotY,
        });
      }
    }

    return list;
  }, [points, spacing]);

  // Smooth realistic LED traveling chase animation
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const time = clock.elapsedTime * 4.0;
    const total = groupRef.current.children.length;

    groupRef.current.children.forEach((child, idx) => {
      // Traveling pulse wave moving forward from start to goal
      const phase = (time - idx * 0.6) % (Math.PI * 2);
      const wave = Math.pow(Math.max(0, Math.sin(phase)), 2.5);
      const intensity = 0.35 + 0.65 * wave;

      child.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mesh = node as THREE.Mesh;
          if (mesh.material && (mesh.material as THREE.MeshStandardMaterial).emissiveIntensity !== undefined) {
            const mat = mesh.material as THREE.MeshStandardMaterial;
            mat.emissiveIntensity = intensity * 1.8;
          }
        }
      });
    });
  });

  if (markers.length === 0) return null;

  return (
    <group ref={groupRef}>
      {markers.map((item, idx) => (
        <group key={idx} position={item.position} rotation={[0, item.rotationY, 0]}>
          {/* 1. Heavy Industrial Ground Recessed Plate (Dark border base) */}
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.6, 0.9]} />
            <meshBasicMaterial color="#081726" transparent opacity={0.65} />
          </mesh>

          {/* 2. Primary High-Vis Chevron Arrowhead (Beveled Solid Wings) */}
          {/* Left Forward Wing */}
          <mesh position={[-0.38, 0.035, 0.08]} rotation={[0, Math.PI / 3.8, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>
          {/* Right Forward Wing */}
          <mesh position={[0.38, 0.035, 0.08]} rotation={[0, -Math.PI / 3.8, 0]}>
            <boxGeometry args={[0.7, 0.03, 0.16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.8}
              roughness={0.2}
              metalness={0.8}
            />
          </mesh>

          {/* 3. Secondary Inner Arrowhead for depth and aerodynamic look */}
          <mesh position={[-0.22, 0.04, -0.16]} rotation={[0, Math.PI / 3.8, 0]}>
            <boxGeometry args={[0.42, 0.03, 0.12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>
          <mesh position={[0.22, 0.04, -0.16]} rotation={[0, -Math.PI / 3.8, 0]}>
            <boxGeometry args={[0.42, 0.03, 0.12]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              roughness={0.2}
              metalness={0.7}
            />
          </mesh>

          {/* 4. Recessed LED Runway Guidance Inset Light (Flush-mount center luminaire) */}
          <mesh position={[0, 0.045, 0.28]}>
            <cylinderGeometry args={[0.09, 0.12, 0.03, 16]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive={color}
              emissiveIntensity={1.4}
              roughness={0.1}
            />
          </mesh>

          {/* 5. Center-Line Ground Taxiway Dash Behind the Arrow */}
          <mesh position={[0, 0.025, -0.38]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 0.35]} />
            <meshBasicMaterial color={color} transparent opacity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
