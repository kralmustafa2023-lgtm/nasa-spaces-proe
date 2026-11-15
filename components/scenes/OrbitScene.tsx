'use client';

import { useState, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import Interactables from '@/components/Interactables';
import { useGameStore } from '@/store/gameStore';
import SceneShell, { ConsoleBlocks } from './SceneShell';

export default function OrbitScene() {
  const setScene = useGameStore((state) => state.setScene);

  const [approachSpeed, setApproachSpeed] = useState(24.0);
  const [distance, setDistance] = useState(150);
  const approachProgress = useRef(0);

  // Smooth deceleration as the shuttle approaches the Space Station (over 3 seconds)
  useFrame((_, delta) => {
    if (approachProgress.current < 1) {
      approachProgress.current = Math.min(1, approachProgress.current + delta / 3.0);
      const p = approachProgress.current;

      // Distance reduces from 150m to 12m
      const d = 150 - p * 138;
      // Approach speed slows down from 24.0 m/s to 0.8 m/s (docking thrusters)
      const spd = 24.0 * (1 - p * 0.96);

      setDistance(Math.max(12, Math.round(d)));
      setApproachSpeed(Math.max(0.8, spd));
    }
  });

  return (
    <SceneShell scene="orbit" window>
      <ConsoleBlocks />

      {/* Orbital Approach & Deceleration Telemetry */}
      <Html position={[0, 3.2, -6.0]} center distanceFactor={8}>
        <div
          style={{
            background: 'rgba(4, 22, 36, 0.92)',
            border: '1px solid #38bdf8',
            padding: '12px 20px',
            borderRadius: '6px',
            color: '#e0f2fe',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            textAlign: 'center',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.35)',
            userSelect: 'none',
          }}
        >
          <div style={{ color: '#38bdf8', fontWeight: 700, letterSpacing: '1px', fontSize: '11px' }}>
            DÜNYA ALÇAK YÖRÜNGESİ (LEO) // 408 KM İRTİFA
          </div>

          <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
            <div style={{ background: 'rgba(8, 28, 46, 0.8)', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e3a50' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>YANAŞMA HIZI</span>
              <strong style={{ fontSize: '13px', color: approachSpeed < 3 ? '#4ade80' : '#facc15' }}>
                {approachSpeed.toFixed(1)} <small style={{ fontSize: '10px', color: '#94a3b8' }}>m/s</small>
              </strong>
            </div>

            <div style={{ background: 'rgba(8, 28, 46, 0.8)', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e3a50' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>İSTASYON MESAFESİ</span>
              <strong style={{ fontSize: '13px', color: distance <= 15 ? '#4ade80' : '#f8fafc' }}>
                {distance} <small style={{ fontSize: '10px', color: '#94a3b8' }}>METRE</small>
              </strong>
            </div>

            <div style={{ background: 'rgba(8, 28, 46, 0.8)', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e3a50' }}>
              <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>HEDEF</span>
              <strong style={{ fontSize: '13px', color: '#38bdf8' }}>ISS HARMONY</strong>
            </div>
          </div>

          <div style={{ marginTop: '8px', fontSize: '10px', color: distance <= 15 ? '#4ade80' : '#38bdf8', fontWeight: 600 }}>
            {distance <= 15
              ? '✓ KENETLENME POZİSYONUNA ULAŞILDI · MEKANİZMAYI DEVREYE ALIN'
              : '▼ FREN İTMELERİ ÇALIŞIYOR · YAVAŞLANIYOR...'}
          </div>
        </div>
      </Html>

      <Interactables
        items={[
          {
            id: 'dock',
            position: [0, 1.4, -4.2],
            radius: 2.6,
            color: '#38bdf8',
            hint: 'KENETLENME',
            label: 'Otomatik Kenetlenme Mekanizmasını Devreye Al (İstasyona Gir)',
            onUse: () => setScene('station'),
          },
        ]}
      />
    </SceneShell>
  );
}
