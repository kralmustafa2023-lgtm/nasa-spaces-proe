'use client';

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { CanvasTexture, Group, Mesh, AdditiveBlending, BackSide } from 'three';

// Module-level singletons so textures are created only ONCE in memory
let cachedSurfaceTexture: CanvasTexture | null = null;
let cachedCloudsTexture: CanvasTexture | null = null;

function getEarthSurfaceTexture(): CanvasTexture {
  if (cachedSurfaceTexture) return cachedSurfaceTexture;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cachedSurfaceTexture = new CanvasTexture(canvas);
    return cachedSurfaceTexture;
  }

  // Ocean gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#091d37');
  oceanGrad.addColorStop(0.3, '#0e2b4f');
  oceanGrad.addColorStop(0.5, '#123966');
  oceanGrad.addColorStop(0.7, '#0e2b4f');
  oceanGrad.addColorStop(1, '#091d37');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Continental shelf glow
  ctx.fillStyle = 'rgba(28, 88, 130, 0.45)';
  ctx.beginPath();
  ctx.ellipse(width * 0.22, height * 0.35, width * 0.16, height * 0.22, -0.15, 0, Math.PI * 2);
  ctx.ellipse(width * 0.32, height * 0.68, width * 0.11, height * 0.24, 0.2, 0, Math.PI * 2);
  ctx.ellipse(width * 0.52, height * 0.52, width * 0.16, height * 0.38, 0, 0, Math.PI * 2);
  ctx.ellipse(width * 0.72, height * 0.35, width * 0.22, height * 0.24, 0.05, 0, Math.PI * 2);
  ctx.ellipse(width * 0.85, height * 0.72, width * 0.09, height * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  const drawLandmass = (cx: number, cy: number, rx: number, ry: number, color: string, points = 16) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const rRatio = 1 + (Math.sin(i * 3.7) * 0.5 + Math.cos(i * 5.3) * 0.5) * 0.22;
      const x = cx + Math.cos(angle) * rx * rRatio;
      const y = cy + Math.sin(angle) * ry * rRatio;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  };

  const green = '#1f4e27';
  const lushGreen = '#2d6a37';
  const desert = '#846c43';
  const tundra = '#3a4b3d';

  // Continents
  drawLandmass(width * 0.22, height * 0.32, width * 0.13, height * 0.17, green, 18);
  drawLandmass(width * 0.18, height * 0.22, width * 0.09, height * 0.09, tundra, 14);
  drawLandmass(width * 0.24, height * 0.45, width * 0.05, height * 0.09, desert, 12);
  drawLandmass(width * 0.32, height * 0.65, width * 0.08, height * 0.22, lushGreen, 16);
  drawLandmass(width * 0.52, height * 0.28, width * 0.08, height * 0.11, lushGreen, 16);
  drawLandmass(width * 0.53, height * 0.45, width * 0.11, height * 0.12, desert, 16);
  drawLandmass(width * 0.54, height * 0.62, width * 0.08, height * 0.18, lushGreen, 16);
  drawLandmass(width * 0.73, height * 0.32, width * 0.18, height * 0.19, green, 20);
  drawLandmass(width * 0.66, height * 0.38, width * 0.07, height * 0.08, desert, 14);
  drawLandmass(width * 0.85, height * 0.70, width * 0.07, height * 0.10, desert, 14);

  // Ice Caps
  ctx.fillStyle = '#e8f6fa';
  ctx.beginPath();
  ctx.ellipse(width * 0.5, 10, width * 0.45, 25, 0, 0, Math.PI * 2);
  ctx.ellipse(width * 0.5, height - 10, width * 0.48, 35, 0, 0, Math.PI * 2);
  ctx.fill();

  // City Lights
  ctx.fillStyle = '#ffcf5c';
  const addLights = (cx: number, cy: number, count: number, spread: number) => {
    for (let i = 0; i < count; i++) {
      const x = cx + (Math.sin(i * 12.3) * spread);
      const y = cy + (Math.cos(i * 7.9) * spread * 0.6);
      ctx.beginPath();
      ctx.arc(x, y, 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  addLights(width * 0.25, height * 0.34, 25, width * 0.05);
  addLights(width * 0.52, height * 0.28, 30, width * 0.06);
  addLights(width * 0.82, height * 0.36, 25, width * 0.06);

  cachedSurfaceTexture = new CanvasTexture(canvas);
  cachedSurfaceTexture.needsUpdate = true;
  return cachedSurfaceTexture;
}

function getEarthCloudsTexture(): CanvasTexture {
  if (cachedCloudsTexture) return cachedCloudsTexture;

  const width = 1024;
  const height = 512;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    cachedCloudsTexture = new CanvasTexture(canvas);
    return cachedCloudsTexture;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';

  // Static cloud clusters
  const clouds = [
    [width * 0.2, height * 0.45, 90, 22],
    [width * 0.45, height * 0.5, 110, 26],
    [width * 0.7, height * 0.48, 95, 24],
    [width * 0.3, height * 0.3, 80, 28],
    [width * 0.6, height * 0.28, 105, 30],
    [width * 0.8, height * 0.32, 85, 25],
    [width * 0.35, height * 0.7, 100, 32],
    [width * 0.75, height * 0.68, 115, 35],
  ];

  for (const [x, y, rx, ry] of clouds) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  cachedCloudsTexture = new CanvasTexture(canvas);
  cachedCloudsTexture.needsUpdate = true;
  return cachedCloudsTexture;
}

interface RealisticEarthProps {
  radius?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  spinSpeed?: number;
}

export default function RealisticEarth({
  radius = 11,
  position = [0, -1, -28],
  rotation = [0.1, 0, 0.41],
  spinSpeed = 0.02,
}: RealisticEarthProps) {
  const earthGroup = useRef<Group>(null);
  const surfaceMesh = useRef<Mesh>(null);
  const cloudsMesh = useRef<Mesh>(null);

  const surfaceTexture = getEarthSurfaceTexture();
  const cloudsTexture = getEarthCloudsTexture();

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (surfaceMesh.current) {
      surfaceMesh.current.rotation.y += dt * spinSpeed;
    }
    if (cloudsMesh.current) {
      cloudsMesh.current.rotation.y += dt * (spinSpeed * 1.3);
    }
  });

  return (
    <group ref={earthGroup} position={position} rotation={rotation}>
      {/* 1. Earth Solid Globe (Optimized to 32x32 segments) */}
      <mesh ref={surfaceMesh}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial
          map={surfaceTexture}
          roughness={0.5}
          metalness={0.1}
          emissive="#06182c"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 2. Clouds Layer (Optimized to 32x32 segments) */}
      <mesh ref={cloudsMesh}>
        <sphereGeometry args={[radius * 1.015, 32, 32]} />
        <meshStandardMaterial
          map={cloudsTexture}
          transparent
          opacity={0.8}
          depthWrite={false}
          roughness={0.9}
        />
      </mesh>

      {/* 3. Soft Atmospheric Halo Glow */}
      <mesh>
        <sphereGeometry args={[radius * 1.04, 24, 24]} />
        <meshBasicMaterial
          color="#52c5ff"
          transparent
          opacity={0.16}
          side={BackSide}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
