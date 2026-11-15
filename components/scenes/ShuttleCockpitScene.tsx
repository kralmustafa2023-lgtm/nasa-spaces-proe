'use client';

import { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { PointLight, Mesh } from 'three';
import Interactables from '@/components/Interactables';
import { useGameStore } from '@/store/gameStore';
import SceneShell, { ConsoleBlocks } from './SceneShell';

export default function ShuttleCockpitScene() {
  const cockpitMode = useGameStore((state) => state.cockpitMode);
  const startLaunch = useGameStore((state) => state.startLaunch);
  const startDescent = useGameStore((state) => state.startDescent);
  const countdown = useGameStore((state) => state.countdown);
  const activeOverlay = useGameStore((state) => state.activeOverlay);
  const activeRepair = useGameStore((state) => state.activeRepair);
  const wristOpen = useGameStore((state) => state.wristOpen);
  const hologramOpen = useGameStore((state) => state.hologramOpen);

  const isModalOpen = wristOpen || hologramOpen || !!activeOverlay || !!activeRepair;

  const launchLightRef = useRef<PointLight>(null);
  const plasmaShieldRef = useRef<Mesh>(null);

  const isDescent = cockpitMode === 'descent';

  // Dynamic telemetry states
  const [altitude, setAltitude] = useState(isDescent ? 408 : 0);
  const [mach, setMach] = useState(isDescent ? 24.5 : 0);
  const flightProgress = useRef(0);

  useEffect(() => {
    flightProgress.current = 0;
    if (isDescent) {
      setAltitude(408);
      setMach(24.5);
    } else {
      setAltitude(0);
      setMach(0);
    }
  }, [isDescent]);

  // Dynamic flight physics: Launch (acceleration) vs Descent (atmospheric braking & touchdown)
  useFrame(({ clock }, delta) => {
    if (countdown !== null) {
      const duration = isDescent ? 4.0 : 3.0;
      flightProgress.current = Math.min(1, flightProgress.current + delta / duration);
      const p = flightProgress.current;

      if (isDescent) {
        // Descent curve: 408 km down to 0 km; Mach 24.5 down to 0
        const remaining = 1 - p;
        const currentMach = remaining * remaining * 24.5;
        const currentAlt = remaining * 408;
        setMach(currentMach);
        setAltitude(currentAlt);

        // Re-entry plasma ionization flicker
        if (launchLightRef.current) {
          const flicker = Math.sin(clock.elapsedTime * 30) * 0.3 + 0.7;
          launchLightRef.current.intensity = (countdown + 1) * 6 * flicker;
        }
      } else {
        // Rocket launch acceleration curve: 0 to Mach 24.5 & 0 to 408 km
        const currentMach = p * p * 24.5;
        const currentAlt = p * p * 408;
        setMach(currentMach);
        setAltitude(currentAlt);

        // Rocket booster flame light
        if (launchLightRef.current) {
          const flicker = Math.sin(clock.elapsedTime * 25) * 0.3 + 0.7;
          launchLightRef.current.intensity = (4 - countdown) * 7 * flicker;
        }
      }
    }
  });

  return (
    <SceneShell scene="shuttleCockpit" window>
      <ConsoleBlocks />

      {/* Cockpit HUD flight instruments with real-time accelerating / decelerating gauges */}
      {!isModalOpen && (
        <Html position={[0, 2.8, -5.8]} center distanceFactor={8}>
          <div
            style={{
              background: 'rgba(3, 20, 34, 0.94)',
              border: isDescent ? '1px solid #f97316' : '1px solid #38bdf8',
              padding: '14px 20px',
              borderRadius: '8px',
              color: '#e0f2fe',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              textAlign: 'center',
              boxShadow: isDescent
                ? '0 0 30px rgba(249, 115, 22, 0.4)'
                : '0 0 30px rgba(56, 189, 248, 0.35)',
              userSelect: 'none',
              minWidth: '380px',
            }}
          >
            <div
              style={{
                color: isDescent ? '#fb923c' : '#38bdf8',
                fontWeight: 700,
                letterSpacing: '1.4px',
                fontSize: '11px',
              }}
            >
              {isDescent
                ? 'ORBITER RE-ENTRY AVIONICS // ATMOSFERE GİRİŞ VE İNİŞ'
                : 'ORBITER LAUNCH AVIONICS // FIRLATMA VE TIRMANMA'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px' }}>
              <div
                style={{
                  background: 'rgba(8, 28, 46, 0.8)',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  border: '1px solid #1e3a50',
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>İRTİFA</span>
                <strong style={{ fontSize: '16px', color: '#f8fafc' }}>
                  {altitude.toFixed(1)} <small style={{ fontSize: '10px', color: '#38bdf8' }}>km</small>
                </strong>
              </div>

              <div
                style={{
                  background: 'rgba(8, 28, 46, 0.8)',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  border: '1px solid #1e3a50',
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>HIZ</span>
                <strong style={{ fontSize: '16px', color: mach > 1 ? '#facc15' : '#4ade80' }}>
                  {mach.toFixed(1)} <small style={{ fontSize: '10px', color: '#94a3b8' }}>Mach</small>
                </strong>
              </div>

              <div
                style={{
                  background: 'rgba(8, 28, 46, 0.8)',
                  padding: '8px 10px',
                  borderRadius: '5px',
                  border: '1px solid #1e3a50',
                }}
              >
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block', fontWeight: 600 }}>
                  {isDescent ? 'PİSTE VARIS' : 'GERİ SAYIM'}
                </span>
                <strong style={{ fontSize: '16px', color: countdown !== null ? '#ef4444' : '#4ade80' }}>
                  {countdown !== null ? `T-${countdown}s` : 'HAZIR'}
                </strong>
              </div>
            </div>

            {countdown !== null && (
              <div
                style={{
                  marginTop: '10px',
                  padding: '6px',
                  background: isDescent ? 'rgba(239, 68, 68, 0.2)' : 'rgba(56, 189, 248, 0.2)',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: isDescent ? '#f87171' : '#facc15',
                  fontWeight: 700,
                  border: isDescent ? '1px solid #ef4444' : '1px solid #facc15',
                }}
              >
                {isDescent
                  ? '🔥 RETRO-FRENLEME DEVREDE · PLAZMA ISI KALKANI AKTİF · PİSTE ALÇALINIYOR'
                  : '🚀 ANA MOTORLAR ATEŞLENDİ · YÖRÜNGEYE YÜKSELİNİYOR...'}
              </div>
            )}
          </div>
        </Html>
      )}

      {/* Re-entry Plasma Thermal Glow or Launch Flame Ambient Light */}
      {countdown !== null && (
        <pointLight
          ref={launchLightRef}
          position={[0, -1.8, -6]}
          color={isDescent ? '#ff4400' : '#f97316'}
          intensity={isDescent ? 28 : 22}
          distance={18}
        />
      )}

      <Interactables
        items={[
          {
            id: isDescent ? 'descent' : 'launch',
            position: [0, 1.4, -4.2],
            radius: 2.8,
            color: isDescent ? '#f97316' : '#facc15',
            hint: isDescent ? 'DÜNYA’YA İNİŞ' : 'FIRLATMA',
            done: countdown !== null,
            label:
              countdown !== null
                ? isDescent
                  ? 'Atmosfere iniş sekansı devrede...'
                  : 'Fırlatma sekansı devrede...'
                : isDescent
                ? 'Retro Motorları Ateşle · Atmosfere Giriş ve İnişi Başlat'
                : 'Ana Motorları Ateşle · Fırlatma Sekansını Başlat',
            onUse: isDescent ? startDescent : startLaunch,
          },
        ]}
      />
    </SceneShell>
  );
}
