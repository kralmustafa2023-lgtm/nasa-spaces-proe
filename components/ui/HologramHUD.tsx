'use client';

import { useState } from 'react';
import { useGameStore, SCENE_LABELS, type Scene } from '@/store/gameStore';
import { ASTRONAUT_PROFILES } from '@/lib/health/astronauts';

interface HologramHUDProps {
  scene: Scene;
  steps: { text: string; done: boolean }[];
}

export default function HologramHUD({ scene, steps }: HologramHUDProps) {
  const [activeTab, setActiveTab] = useState<'telemetry' | 'hazards'>('telemetry');
  const days = useGameStore((state) => state.missionDays);
  const toggleHologram = useGameStore((state) => state.toggleHologram);
  const scans = useGameStore((state) => state.scans);
  const notify = useGameStore((state) => state.notify);
  const astronautId = useGameStore((state) => state.astronautId);
  const astronaut = astronautId ? ASTRONAUT_PROFILES[astronautId] : null;

  // Latest available vital telemetry from the simulation engine
  const latestScan = scans.post ?? scans.orbit ?? scans.baseline;
  const cardio = latestScan?.metrics.find((m) => m.id === 'cardio');
  const radiation = latestScan?.metrics.find((m) => m.id === 'radiation');
  const muscle = latestScan?.metrics.find((m) => m.id === 'muscle');
  const bone = latestScan?.metrics.find((m) => m.id === 'bone');
  const sleepMood = latestScan?.metrics.find((m) => m.id === 'sleepMood');

  const hrDisplay = cardio ? cardio.displayValue : '74 bpm';
  const radDisplay = radiation ? radiation.displayValue : '0.04 mSv';
  const muscleDisplay = muscle ? muscle.displayValue : 'Nominal';
  const boneDisplay = bone ? bone.displayValue : '%100 BMD';

  const applyAction = (name: string, effect: string) => {
    notify(`[HRP EYLEM] ${name} protokolü devreye alındı. ${effect}`);
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '75px',
        left: '30px',
        width: '360px',
        maxWidth: 'calc(100vw - 60px)',
        background: 'rgba(3, 16, 28, 0.94)',
        border: '1px solid #38bdf8',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(56, 189, 248, 0.4), inset 0 0 15px rgba(56, 189, 248, 0.12)',
        backdropFilter: 'blur(12px)',
        padding: '14px 16px',
        color: '#e0f2fe',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        zIndex: 50,
        pointerEvents: 'auto',
        animation: 'holoFadeIn 0.25s ease-out',
      }}
    >
      <style>{`
        @keyframes holoFadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>

      {/* Hologram Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <div>
          <span style={{ fontSize: '9px', color: '#38bdf8', letterSpacing: '1.5px', fontWeight: 700 }}>
            NASA BIO-SUIT // OTONOM SAĞLIK İZLEME
          </span>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#f8fafc', marginTop: '2px' }}>
            {SCENE_LABELS[scene]}
          </div>
        </div>
        <button
          onClick={toggleHologram}
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid #38bdf8',
            borderRadius: '4px',
            color: '#38bdf8',
            fontSize: '10px',
            padding: '2px 8px',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          [R] Kapat
        </button>
      </div>

      {/* Selected Astronaut Info Banner */}
      {astronaut && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '5px 8px',
            marginBottom: '8px',
            background: `${astronaut.badgeColor}15`,
            borderRadius: '6px',
            border: `1px solid ${astronaut.badgeColor}55`,
            fontSize: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '14px' }}>{astronaut.avatarIcon}</span>
            <span style={{ color: astronaut.badgeColor, fontWeight: 800 }}>{astronaut.callsign}</span>
            <span style={{ color: '#e2e8f0', fontWeight: 600 }}>{astronaut.name}</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '9px' }}>
            Yaş {astronaut.age} · {astronaut.flightsCompleted} Uçuş
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('telemetry')}
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '4px',
            border: activeTab === 'telemetry' ? '1px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.2)',
            background: activeTab === 'telemetry' ? 'rgba(56, 189, 248, 0.25)' : 'rgba(8, 28, 46, 0.6)',
            color: activeTab === 'telemetry' ? '#e0f2fe' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          📊 VİTAL & HEDEFLER
        </button>
        <button
          onClick={() => setActiveTab('hazards')}
          style={{
            flex: 1,
            padding: '5px 8px',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '4px',
            border: activeTab === 'hazards' ? '1px solid #facc15' : '1px solid rgba(250, 204, 21, 0.2)',
            background: activeTab === 'hazards' ? 'rgba(250, 204, 21, 0.25)' : 'rgba(8, 28, 46, 0.6)',
            color: activeTab === 'hazards' ? '#fef08a' : '#94a3b8',
            cursor: 'pointer',
          }}
        >
          🛡️ UZAY TEHLİKELERİ & EYLEM
        </button>
      </div>

      {activeTab === 'telemetry' ? (
        <>
          {/* Live Vitals Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '4px',
              marginBottom: '10px',
              background: 'rgba(6, 24, 40, 0.85)',
              padding: '8px 8px',
              borderRadius: '6px',
              border: '1px solid #1e3a4e',
            }}
          >
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>KARDİYO</span>
              <strong style={{ fontSize: '11px', color: '#4ade80' }}>{hrDisplay}</strong>
            </div>
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>RADYASYON</span>
              <strong style={{ fontSize: '11px', color: '#facc15' }}>{radDisplay}</strong>
            </div>
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>KAS GÜCÜ</span>
              <strong style={{ fontSize: '11px', color: '#38bdf8' }}>{muscleDisplay}</strong>
            </div>
            <div>
              <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>KEMİK (BMD)</span>
              <strong style={{ fontSize: '11px', color: '#818cf8' }}>{boneDisplay}</strong>
            </div>
          </div>

          {/* Checklist of Objectives */}
          <div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1px', marginBottom: '6px' }}>
              GÖREV HEDEFLERİ
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'grid', gap: '5px' }}>
              {steps.map((step, idx) => (
                <li
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '11px',
                    color: step.done ? '#64748b' : '#f1f5f9',
                    textDecoration: step.done ? 'line-through' : 'none',
                  }}
                >
                  <span
                    style={{
                      color: step.done ? '#4ade80' : '#38bdf8',
                      fontWeight: 700,
                      fontSize: '12px',
                    }}
                  >
                    {step.done ? '✓' : '○'}
                  </span>
                  <span>{step.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </>
      ) : (
        /* NASA 4 Space Hazards Self-Diagnosis & Direct Countermeasures */
        <div style={{ maxHeight: '230px', overflowY: 'auto', display: 'grid', gap: '8px', paddingRight: '4px' }}>
          {/* 1. Space Radiation */}
          <div style={{ background: 'rgba(8, 28, 46, 0.75)', border: '1px solid #1e3a50', borderRadius: '5px', padding: '6px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#facc15' }}>☢️ UZAY RADYASYONU & DNA</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1' }}>{radDisplay}</span>
            </div>
            <p style={{ margin: '3px 0 5px', fontSize: '9px', color: '#94a3b8' }}>
              GCR ve güneş fırtınası kaynaklı hücresel hasar riski.
            </p>
            <button
              onClick={() => applyAction('Antioksidan & Kalkan', 'Radyasyon koruma kalkanı güçlendirildi.')}
              style={{
                width: '100%',
                padding: '3px 6px',
                fontSize: '9px',
                fontWeight: 600,
                background: 'rgba(250, 204, 21, 0.2)',
                border: '1px solid #facc15',
                color: '#fef08a',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              ⚡ Kalkanı Güçlendir & Antioksidan Al
            </button>
          </div>

          {/* 2. Isolation & Confinement */}
          <div style={{ background: 'rgba(8, 28, 46, 0.75)', border: '1px solid #1e3a50', borderRadius: '5px', padding: '6px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8' }}>🌌 İZOLASYON & DAVRANIŞSAL SAĞLIK</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1' }}>{sleepMood ? sleepMood.displayValue : 'Nominal'}</span>
            </div>
            <p style={{ margin: '3px 0 5px', fontSize: '9px', color: '#94a3b8' }}>
              Kapalı alan, sirkadiyen kayma ve kognitif tükenmişlik önleme.
            </p>
            <button
              onClick={() => applyAction('Earth-View VR', 'Sirkadiyen ışık ve aile iletişim protokolü başlatıldı.')}
              style={{
                width: '100%',
                padding: '3px 6px',
                fontSize: '9px',
                fontWeight: 600,
                background: 'rgba(56, 189, 248, 0.2)',
                border: '1px solid #38bdf8',
                color: '#7dd3fc',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              🧠 Earth-View VR & Sirkadiyen Işık Başlat
            </button>
          </div>

          {/* 3. Altered Gravity (Bone & Muscle) */}
          <div style={{ background: 'rgba(8, 28, 46, 0.75)', border: '1px solid #1e3a50', borderRadius: '5px', padding: '6px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#a78bfa' }}>⚖️ MİKROYERÇEKİMİ · KEMİK & KAS</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1' }}>{boneDisplay}</span>
            </div>
            <p style={{ margin: '3px 0 5px', fontSize: '9px', color: '#94a3b8' }}>
              Osteoklast aktivasyonu ve kas atrofisine karşı direnç protokolü.
            </p>
            <button
              onClick={() => applyAction('ARED Egzersizi', '2.5 saatlik ARED direnç ve T2 seansı planlandı.')}
              style={{
                width: '100%',
                padding: '3px 6px',
                fontSize: '9px',
                fontWeight: 600,
                background: 'rgba(167, 139, 250, 0.2)',
                border: '1px solid #a78bfa',
                color: '#ddd6fe',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              🏋️ ARED Direnç Egzersiz Protokolünü Uygula
            </button>
          </div>

          {/* 4. Hostile Environment & Cardiovascular */}
          <div style={{ background: 'rgba(8, 28, 46, 0.75)', border: '1px solid #1e3a50', borderRadius: '5px', padding: '6px 8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#4ade80' }}>🫀 KARDİYOVASKÜLER & SIVI KAYMASI</span>
              <span style={{ fontSize: '9px', color: '#cbd5e1' }}>{hrDisplay}</span>
            </div>
            <p style={{ margin: '3px 0 5px', fontSize: '9px', color: '#94a3b8' }}>
              Sıvı kayması (Cephalad shift) ve ortostatik intolerans önleme.
            </p>
            <button
              onClick={() => applyAction('LBNP Negatif Basınç', 'Alt vücut negatif basınç ve elektrolit yüklemesi aktif.')}
              style={{
                width: '100%',
                padding: '3px 6px',
                fontSize: '9px',
                fontWeight: 600,
                background: 'rgba(74, 222, 128, 0.2)',
                border: '1px solid #4ade80',
                color: '#86efac',
                borderRadius: '3px',
                cursor: 'pointer',
              }}
            >
              💧 LBNP Basınç & Elektrolit Yüklemesi Yap
            </button>
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div
        style={{
          marginTop: '10px',
          paddingTop: '8px',
          borderTop: '1px solid rgba(56, 189, 248, 0.2)',
          fontSize: '9px',
          color: '#94a3b8',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>GÖREV: <strong style={{ color: '#38bdf8' }}>{days} GÜN</strong></span>
        <span style={{ color: '#4ade80' }}>● ÖZ-DEĞERLENDİRME AKTİF</span>
      </div>
    </div>
  );
}
