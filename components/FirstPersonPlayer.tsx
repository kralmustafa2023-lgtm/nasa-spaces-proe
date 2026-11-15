'use client';

import { useEffect, useRef } from 'react';
import { PointerLockControls } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import type { PointerLockControls as Controls } from 'three-stdlib';
import { Vector3 } from 'three';
import { useGameStore, type Scene } from '@/store/gameStore';

export const PLAYER_HEIGHT = 1.7;
const PLAYER_COLLISION_RADIUS = 0.45;

export const SCENE_BOUNDS: Record<Scene, { minX: number; maxX: number; minZ: number; maxZ: number }> = {
  intro: { minX: -34, maxX: 38, minZ: -32, maxZ: 25 },
  launchCenterScan1: { minX: -8.2, maxX: 8.2, minZ: -8.2, maxZ: 8.2 },
  shuttleCockpit: { minX: -2.8, maxX: 2.8, minZ: -4.5, maxZ: 2.5 },
  orbit: { minX: -5.5, maxX: 5.5, minZ: -5.5, maxZ: 5.5 },
  station: { minX: -4.4, maxX: 4.4, minZ: -7.5, maxZ: 7.5 },
  landing: { minX: -34, maxX: 38, minZ: -32, maxZ: 25 },
  launchCenterScan2: { minX: -8.2, maxX: 8.2, minZ: -8.2, maxZ: 8.2 },
};

interface Hitbox {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

/**
 * Solid Collision Hitboxes for Buildings, Desks, Consoles, Towers and Trees
 * Prevents player from walking through walls or solid models.
 */
const SCENE_OBSTACLES: Record<Scene, Hitbox[]> = {
  intro: [
    // HQ Main Building Left Wing
    { minX: -18, maxX: -2.2, minZ: -28, maxZ: -15.4 },
    // HQ Main Building Right Wing
    { minX: 2.2, maxX: 18, minZ: -28, maxZ: -15.4 },
    // HQ Building Rear Solid Wall
    { minX: -18, maxX: 18, minZ: -34, maxZ: -24 },
    // VAB Backdrop Facility
    { minX: -55, maxX: -28, minZ: -62, maxZ: -38 },
    // Launchpad Gantry Steel Lattice Column (Service Tower)
    { minX: 19.5, maxX: 24.5, minZ: -24.5, maxZ: -19.5 },
    // Rocket Booster & External Tank Foundation
    { minX: 25.0, maxX: 32.5, minZ: -26.0, maxZ: -21.0 },
    // Access Gantry Guardrails (keep player on the stairs when climbing)
    { minX: 24.0, maxX: 26.2, minZ: -21.0, maxZ: -9.5 },
    { minX: 29.8, maxX: 32.0, minZ: -21.0, maxZ: -9.5 },
    // Trees on Ground
    { minX: -12.6, maxX: -11.4, minZ: 7.4, maxZ: 8.6 },
    { minX: 11.4, maxX: 12.6, minZ: 7.4, maxZ: 8.6 },
    { minX: -14.6, maxX: -13.4, minZ: -2.6, maxZ: -1.4 },
    { minX: 13.4, maxX: 14.6, minZ: -2.6, maxZ: -1.4 },
    { minX: -18.6, maxX: -17.4, minZ: -12.6, maxZ: -11.4 },
    { minX: 17.4, maxX: 18.6, minZ: -12.6, maxZ: -11.4 },
    { minX: -8.6, maxX: -7.4, minZ: 17.4, maxZ: 18.6 },
    { minX: 7.4, maxX: 8.6, minZ: 17.4, maxZ: 18.6 },
    { minX: -22.6, maxX: -21.4, minZ: 3.4, maxZ: 4.6 },
    { minX: 21.4, maxX: 22.6, minZ: 3.4, maxZ: 4.6 },
    { minX: -26.6, maxX: -25.4, minZ: -8.6, maxZ: -7.4 },
    { minX: 25.4, maxX: 26.6, minZ: -4.6, maxZ: -3.4 },
  ],
  landing: [
    // HQ Building
    { minX: -18, maxX: -2.2, minZ: -28, maxZ: -15.4 },
    { minX: 2.2, maxX: 18, minZ: -28, maxZ: -15.4 },
    { minX: -18, maxX: 18, minZ: -34, maxZ: -24 },
    // VAB Facility
    { minX: -55, maxX: -28, minZ: -62, maxZ: -38 },
    // Landed Shuttle Fuselage & Wings (solid obstacle on runway)
    { minX: 16.5, maxX: 27.5, minZ: -14.0, maxZ: -6.0 },
    // Trees
    { minX: -12.6, maxX: -11.4, minZ: 7.4, maxZ: 8.6 },
    { minX: 11.4, maxX: 12.6, minZ: 7.4, maxZ: 8.6 },
    { minX: -14.6, maxX: -13.4, minZ: -2.6, maxZ: -1.4 },
    { minX: 13.4, maxX: 14.6, minZ: -2.6, maxZ: -1.4 },
  ],
  launchCenterScan1: [
    // Command Director Consoles (Flight Control Banks)
    { minX: -5.8, maxX: 5.8, minZ: -5.6, maxZ: -4.0 },
    // Mark III Spacesuit Display Pedestal
    { minX: 5.5, maxX: 7.5, minZ: -7.5, maxZ: -5.5 },
    // Health Booth outer shell/back
    { minX: -6.8, maxX: -4.2, minZ: -7.2, maxZ: -6.2 },
  ],
  launchCenterScan2: [
    { minX: -5.8, maxX: 5.8, minZ: -5.6, maxZ: -4.0 },
    { minX: -6.8, maxX: -4.2, minZ: -7.2, maxZ: -6.2 },
  ],
  station: [
    // Oxygen Scrubber Console
    { minX: -4.4, maxX: -2.8, minZ: -3.8, maxZ: -2.6 },
    // Thermal Loop Terminal
    { minX: 2.8, maxX: 4.4, minZ: -3.8, maxZ: -2.6 },
    // Comm Antenna Terminal
    { minX: -1.2, maxX: 1.2, minZ: -6.2, maxZ: -4.8 },
    // ISS Bio-Medical Research Booth
    { minX: -5.0, maxX: -3.6, minZ: 1.6, maxZ: 3.4 },
  ],
  shuttleCockpit: [
    // Forward Instrument Deck
    { minX: -2.5, maxX: 2.5, minZ: -4.8, maxZ: -3.2 },
  ],
  orbit: [
    // Forward Console
    { minX: -3.5, maxX: 3.5, minZ: -5.2, maxZ: -3.4 },
  ],
};

function isPositionValid(x: number, z: number, scene: Scene): boolean {
  const obstacles = SCENE_OBSTACLES[scene];
  if (!obstacles) return true;

  const r = PLAYER_COLLISION_RADIUS;
  for (let i = 0; i < obstacles.length; i++) {
    const box = obstacles[i];
    if (x + r > box.minX && x - r < box.maxX && z + r > box.minZ && z - r < box.maxZ) {
      return false; // Collision detected!
    }
  }
  return true;
}

const SCENE_SPAWNS: Record<Scene, [number, number, number]> = {
  intro: [0, PLAYER_HEIGHT, 15],
  launchCenterScan1: [0, PLAYER_HEIGHT, 5],
  shuttleCockpit: [0, PLAYER_HEIGHT, 1.2],
  orbit: [0, PLAYER_HEIGHT, 3],
  station: [0, PLAYER_HEIGHT, 5],
  landing: [0, PLAYER_HEIGHT, 4],
  launchCenterScan2: [0, PLAYER_HEIGHT, 5],
};

/**
 * Dynamic terrain / stair height calculator
 */
function getGroundHeight(x: number, z: number, scene: Scene): number {
  if (scene === 'intro' || scene === 'landing') {
    // Launchpad Gantry Access Stairs: x between 26 and 30, z between -16.5 and -9.0
    if (x >= 26 && x <= 30 && z >= -16.5 && z <= -9.0) {
      const progress = Math.max(0, Math.min(1, (-9.0 - z) / 7.5));
      return PLAYER_HEIGHT + progress * 4.6;
    }
    // Gantry Crew Access Deck: x between 26 and 30, z between -21.0 and -16.5
    if (x >= 26 && x <= 30 && z >= -21.0 && z < -16.5) {
      return PLAYER_HEIGHT + 4.6;
    }
  }
  return PLAYER_HEIGHT;
}

export default function FirstPersonPlayer({ onLockChange }: { onLockChange: (locked: boolean) => void }) {
  const controls = useRef<Controls>(null);
  const keys = useRef(new Set<string>());
  const direction = useRef(new Vector3());
  const right = useRef(new Vector3());
  const movement = useRef(new Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);

  const camera = useThree((state) => state.camera);
  const gl = useThree((state) => state.gl);
  const scene = useGameStore((state) => state.scene);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const toggleHologram = useGameStore((state) => state.toggleHologram);

  const isModalOpen = wristOpen || !!activeOverlay || !!activeRepair;

  // Scene spawn positioning
  useEffect(() => {
    const spawn = SCENE_SPAWNS[scene] ?? [0, PLAYER_HEIGHT, 6];
    camera.position.set(spawn[0], spawn[1], spawn[2]);
    camera.rotation.set(0, 0, 0);
    keys.current.clear();
    verticalVelocity.current = 0;
    isGrounded.current = true;
  }, [camera, scene]);

  // Unlock pointer when a modal is opened
  useEffect(() => {
    if (isModalOpen) {
      controls.current?.unlock();
      keys.current.clear();
    }
  }, [isModalOpen]);

  // Click on the 3D canvas or game area to lock the mouse cursor directly
  useEffect(() => {
    const dom = gl.domElement;
    const handleClick = (e: MouseEvent) => {
      const state = useGameStore.getState();
      const modalActive = state.wristOpen || !!state.activeOverlay || !!state.activeRepair;
      if (!modalActive && !controls.current?.isLocked) {
        controls.current?.lock();
      }
    };

    dom.addEventListener('click', handleClick);
    window.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest('.enter-prompt') || target?.closest('.scene-canvas')) {
        const state = useGameStore.getState();
        const modalActive = state.wristOpen || !!state.activeOverlay || !!state.activeRepair;
        if (!modalActive && !controls.current?.isLocked) {
          controls.current?.lock();
        }
      }
    });

    return () => {
      dom.removeEventListener('click', handleClick);
    };
  }, [gl]);

  // Keyboard controls listener
  useEffect(() => {
    const clear = () => keys.current.clear();
    const down = (event: KeyboardEvent) => {
      const state = useGameStore.getState();
      if (state.activeOverlay || state.wristOpen || state.activeRepair) return;
      if (event.target instanceof HTMLElement && event.target.matches('input,textarea,select')) return;

      // 'R' key toggles wrist holographic HUD
      if (event.code === 'KeyR' && !event.repeat) {
        event.preventDefault();
        toggleHologram();
        return;
      }

      // Spacebar for Jump
      if (event.code === 'Space') {
        event.preventDefault();
        if (isGrounded.current) {
          verticalVelocity.current = 5.6; // Jump impulse
          isGrounded.current = false;
        }
        return;
      }

      if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(event.code)) {
        event.preventDefault();
        keys.current.add(event.code);
      }
    };

    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };

    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', clear);
    };
  }, [toggleHologram]);

  // Motion physics
  useFrame((_, delta) => {
    if (!controls.current?.isLocked || isModalOpen) return;

    // Horizontal Movement
    camera.getWorldDirection(direction.current);
    direction.current.y = 0;
    direction.current.normalize();
    right.current.crossVectors(direction.current, camera.up).normalize();

    const forward = Number(keys.current.has('KeyW')) - Number(keys.current.has('KeyS'));
    const strafe = Number(keys.current.has('KeyD')) - Number(keys.current.has('KeyA'));
    movement.current.copy(direction.current).multiplyScalar(forward).addScaledVector(right.current, strafe);

    const speed = scene === 'intro' || scene === 'landing' ? 4.8 : 3.4;
    if (movement.current.lengthSq() > 0) {
      const step = movement.current.normalize().multiplyScalar(Math.min(delta, 0.05) * speed);
      const bounds = SCENE_BOUNDS[scene] ?? { minX: -8, maxX: 8, minZ: -8, maxZ: 8 };

      // Axis-separated movement test for smooth wall-sliding collision response
      const targetX = Math.max(bounds.minX, Math.min(bounds.maxX, camera.position.x + step.x));
      if (isPositionValid(targetX, camera.position.z, scene)) {
        camera.position.x = targetX;
      }

      const targetZ = Math.max(bounds.minZ, Math.min(bounds.maxZ, camera.position.z + step.z));
      if (isPositionValid(camera.position.x, targetZ, scene)) {
        camera.position.z = targetZ;
      }
    }

    // Vertical Physics & Ground / Stairs Detection
    const groundY = getGroundHeight(camera.position.x, camera.position.z, scene);
    const gravity = -15; // Realistic downward acceleration

    verticalVelocity.current += gravity * Math.min(delta, 0.05);
    camera.position.y += verticalVelocity.current * Math.min(delta, 0.05);

    if (camera.position.y <= groundY) {
      camera.position.y = groundY;
      verticalVelocity.current = 0;
      isGrounded.current = true;
    } else {
      isGrounded.current = false;
    }
  });

  return (
    <PointerLockControls
      ref={controls}
      enabled={!isModalOpen}
      onLock={() => onLockChange(true)}
      onUnlock={() => {
        keys.current.clear();
        onLockChange(false);
      }}
    />
  );
}
