'use client';

import { useState } from 'react';
import { ASTRONAUT_PROFILES, type AstronautId, type AstronautProfile } from '@/lib/health/astronauts';
import { useGameStore } from '@/store/gameStore';

/* ─────────────────────────── helpers ─────────────────────────── */

const ORDER: AstronautId[] = ['rookie', 'veteran', 'senior'];

type RiskKey = 'boneLoss' | 'muscleLoss' | 'stressIncrease' | 'cardioLoss';
const RISK_BARS: { key: RiskKey; label: string; inverted?: boolean }[] = [
  { key: 'boneLoss',      label: 'Kemik Riski' },
  { key: 'muscleLoss',    label: 'Kas Riski' },
  { key: 'cardioLoss',   label: 'Kalp Riski' },
  { key: 'stressIncrease', label: 'Stres Riski' },
];

/** Map multiplier 0.5-1.5 → 0-100 fill for risk bars */
function riskPct(mult: number): number {
  return Math.min(100, Math.max(0, Math.round(((mult - 0.4) / 1.2) * 100)));
}

function riskColor(pct: number): string {
  if (pct >= 70) return '#ef4444';
  if (pct >= 45) return '#f59e0b';
  return '#22c55e';
}

/* ─────────────────────────── sub-components ─────────────────────────── */

function StatBar({ label, pct }: { label: string; pct: number }) {
  const color = riskColor(pct);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8', marginBottom: 3, letterSpacing: '0.5px' }}>
        <span>{label}</span>
        <span style={{ color }}>{pct >= 70 ? 'YÜKSEK' : pct >= 45 ? 'ORTA' : 'DÜŞÜK'}</span>
      </div>
      <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
}

function ProfileCard({
  profile,
  selected,
  hovered,
  onHover,
  onSelect,
}: {
  profile: AstronautProfile;
  selected: boolean;
  hovered: boolean;
  onHover: (v: boolean) => void;
  onSelect: () => void;
}) {
  const active = selected || hovered;
  const glow = active ? `0 0 32px ${profile.badgeColor}55, 0 0 64px ${profile.badgeColor}22` : 'none';

  return (
    <div
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{
        flex: 1,
        maxWidth: 340,
        minWidth: 260,
        display: 'flex',
        flexDirection: 'column',
        background: selected
          ? `linear-gradient(160deg, ${profile.badgeColor}18 0%, rgba(15,23,42,0.95) 60%)`
          : 'rgba(15,23,42,0.85)',
        border: `1.5px solid ${active ? profile.badgeColor : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 16,
        padding: '28px 24px 24px',
        cursor: 'pointer',
        transition: 'all 0.25s ease',
        boxShadow: glow,
        transform: hovered && !selected ? 'translateY(-4px)' : selected ? 'translateY(-6px) scale(1.02)' : 'none',
        position: 'relative',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Selected badge */}
      {selected && (
        <div style={{
          position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
          background: profile.badgeColor, color: '#030a14', fontSize: 10, fontWeight: 800,
          padding: '3px 12px', borderRadius: 20, letterSpacing: '1.5px',
        }}>
          SEÇİLDİ
        </div>
      )}

      {/* Badge color top line */}
      <div style={{ position: 'absolute', top: 0, left: 24, right: 24, height: 2, background: profile.badgeColor, borderRadius: '0 0 2px 2px', opacity: active ? 1 : 0.4, transition: 'opacity 0.25s' }} />

      {/* Avatar + callsign */}
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{
          fontSize: 56, lineHeight: 1, marginBottom: 10,
          filter: `drop-shadow(0 0 12px ${profile.badgeColor}88)`,
        }}>
          {profile.avatarIcon}
        </div>
        <div style={{
          display: 'inline-block', background: `${profile.badgeColor}22`,
          border: `1px solid ${profile.badgeColor}66`, color: profile.badgeColor,
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
          letterSpacing: '1.5px', marginBottom: 10,
        }}>
          {profile.callsign}
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', letterSpacing: '0.3px', lineHeight: 1.2 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, letterSpacing: '0.3px' }}>
          {profile.roleTR}
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 18 }}>
        {[
          { label: 'YAŞ', value: profile.age },
          { label: 'UÇUŞ', value: profile.flightsCompleted },
          { label: 'DENEYİM', value: `${profile.experienceYears}Y` },
        ].map(({ label, value }) => (
          <div key={label} style={{
            flex: 1, background: 'rgba(255,255,255,0.04)', borderRadius: 8,
            padding: '8px 4px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: profile.badgeColor }}>{value}</div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '1px', marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div style={{
        fontSize: 11.5, color: '#94a3b8', lineHeight: 1.6, marginBottom: 18,
        padding: '10px 12px', background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8,
        minHeight: 72,
      }}>
        {profile.physioSummaryTR}
      </div>

      {/* Risk bars */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 9, color: '#475569', letterSpacing: '2px', marginBottom: 8, textTransform: 'uppercase' }}>
          Fizyolojik Risk Profili
        </div>
        {RISK_BARS.map(({ key, label }) => (
          <StatBar key={key} label={label} pct={riskPct(profile.multipliers[key])} />
        ))}
      </div>

      {/* Select button */}
      <button
        onClick={onSelect}
        style={{
          width: '100%',
          padding: '12px 0',
          background: selected
            ? profile.badgeColor
            : active
            ? `${profile.badgeColor}22`
            : 'rgba(255,255,255,0.04)',
          border: `1.5px solid ${active ? profile.badgeColor : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 10,
          color: selected ? '#030a14' : active ? profile.badgeColor : '#64748b',
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '2px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          textTransform: 'uppercase' as const,
        }}
      >
        {selected ? '✓ SEÇİLDİ' : 'SEÇMEK İÇİN TIKLAYINIZ'}
      </button>
    </div>
  );
}

/* ─────────────────────────── main component ─────────────────────────── */

export default function AstronautSelect() {
  const setAstronaut = useGameStore((state) => state.setAstronaut);
  const [selected, setSelected] = useState<AstronautId | null>(null);
  const [hovered, setHovered] = useState<AstronautId | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleSelect(id: AstronautId) {
    setSelected(id);
  }

  function handleConfirm() {
    if (!selected || confirming) return;
    setConfirming(true);
    setTimeout(() => {
      setAstronaut(selected);
    }, 800);
  }

  const selectedProfile = selected ? ASTRONAUT_PROFILES[selected] : null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'radial-gradient(ellipse at 50% 20%, #0f172a 0%, #030a14 70%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'flex-start', overflowY: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", sans-serif',
        animation: confirming ? 'fadeOut 0.7s ease forwards' : 'fadeIn 0.6s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
        @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: scale(1.04); } }
        @keyframes starFloat { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes pulseGlow { 0%,100%{opacity:.7} 50%{opacity:1} }
        @keyframes scanLine { from{top:0} to{top:100%} }
        ::-webkit-scrollbar { width: 4px; background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.3); border-radius: 2px; }
      `}</style>

      {/* Starfield background dots */}
      {Array.from({ length: 60 }).map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          left: `${(i * 37 + 11) % 100}%`,
          top: `${(i * 61 + 7) % 100}%`,
          width: i % 5 === 0 ? 2.5 : 1.5,
          height: i % 5 === 0 ? 2.5 : 1.5,
          borderRadius: '50%',
          background: '#fff',
          opacity: 0.08 + (i % 3) * 0.06,
          animation: `starFloat ${3 + (i % 4)}s ease-in-out ${(i % 5) * 0.4}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Header */}
      <div style={{ width: '100%', maxWidth: 1100, padding: '40px 24px 0', textAlign: 'center' }}>
        {/* NASA meatball */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 24 }}>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'conic-gradient(#0b3d91 0deg 180deg, #fc3d21 180deg 270deg, #0b3d91 270deg 360deg)',
            border: '2px solid rgba(56,189,248,0.4)',
            boxShadow: '0 0 20px rgba(11,61,145,0.5)',
            flexShrink: 0,
          }} />
          <div>
            <div style={{ fontSize: 11, color: '#38bdf8', letterSpacing: '4px', fontWeight: 700 }}>
              NASA · MISSION 180
            </div>
            <div style={{ fontSize: 9, color: '#475569', letterSpacing: '3px', marginTop: 2 }}>
              SPACES PROE · ASTRONAUT SELECTION PROTOCOL
            </div>
          </div>
          <div style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'conic-gradient(#0b3d91 0deg 180deg, #fc3d21 180deg 270deg, #0b3d91 270deg 360deg)',
            border: '2px solid rgba(56,189,248,0.4)',
            boxShadow: '0 0 20px rgba(11,61,145,0.5)',
            flexShrink: 0,
            transform: 'scaleX(-1)',
          }} />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 900, margin: '0 0 8px',
          color: '#f1f5f9', letterSpacing: '-0.5px', lineHeight: 1.1,
        }}>
          ASTRONOT PROFİLİ SEÇİN
        </h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 auto 32px', maxWidth: 540, lineHeight: 1.6 }}>
          Seçtiğiniz profil, uzay yolculuğu boyunca sağlık metriklerinizi, fizyolojik risk faktörlerinizi
          ve NASA HRP karşı önlem etkinliklerini doğrudan etkiler.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(56,189,248,0.3), transparent)', marginBottom: 32 }} />
      </div>

      {/* Cards */}
      <div style={{
        width: '100%', maxWidth: 1100, padding: '0 24px',
        display: 'flex', gap: 20, flexWrap: 'wrap' as const, justifyContent: 'center',
      }}>
        {ORDER.map((id) => (
          <ProfileCard
            key={id}
            profile={ASTRONAUT_PROFILES[id]}
            selected={selected === id}
            hovered={hovered === id}
            onHover={(v) => setHovered(v ? id : null)}
            onSelect={() => handleSelect(id)}
          />
        ))}
      </div>

      {/* Confirm section */}
      <div style={{
        width: '100%', maxWidth: 1100, padding: '32px 24px 48px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        {selectedProfile && (
          <div style={{
            padding: '14px 24px', background: `${selectedProfile.badgeColor}11`,
            border: `1px solid ${selectedProfile.badgeColor}44`,
            borderRadius: 12, fontSize: 13, color: '#cbd5e1', maxWidth: 600, textAlign: 'center',
            animation: 'fadeIn 0.3s ease',
          }}>
            <strong style={{ color: selectedProfile.badgeColor }}>
              {selectedProfile.name}
            </strong>{' '}
            ({selectedProfile.callsign}) seçildi — göreve başlamak için onaylayın.
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selected || confirming}
          style={{
            padding: '16px 56px',
            background: selected
              ? `linear-gradient(135deg, ${selectedProfile!.badgeColor} 0%, ${selectedProfile!.badgeColor}bb 100%)`
              : 'rgba(255,255,255,0.05)',
            border: `2px solid ${selected ? selectedProfile!.badgeColor : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 14,
            color: selected ? '#030a14' : '#374151',
            fontSize: 13, fontWeight: 800, letterSpacing: '2.5px',
            cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
            boxShadow: selected ? `0 0 24px ${selectedProfile!.badgeColor}55` : 'none',
            textTransform: 'uppercase' as const,
            opacity: confirming ? 0.6 : 1,
          }}
        >
          {confirming ? '⏳ GÖREV BAŞLATILIYOR…' : selected ? '🚀 GÖREVE BAŞLA' : 'ÖNCE BİR PROFİL SEÇİN'}
        </button>

        {/* Bottom disclaimer */}
        <div style={{ fontSize: 10, color: '#1e293b', letterSpacing: '0.5px', textAlign: 'center', marginTop: 8 }}>
          NASA SPACES PROE · SİMÜLASYON — Tüm sağlık verileri simüle edilmiştir; gerçek tıbbi tavsiye değildir.
        </div>
      </div>
    </div>
  );
}
