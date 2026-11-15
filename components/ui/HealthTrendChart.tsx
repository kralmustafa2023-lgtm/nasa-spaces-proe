'use client';

import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useGameStore } from '@/store/gameStore';
import { ASTRONAUT_PROFILES } from '@/lib/health/astronauts';
import type { ScanSet } from '@/lib/health/types';

interface HealthTrendChartProps {
  scans?: ScanSet;
}

export default function HealthTrendChart({ scans: propScans }: HealthTrendChartProps) {
  const storeScans = useGameStore((state) => state.scans);
  const astronautId = useGameStore((state) => state.astronautId);
  const astronaut = astronautId ? ASTRONAUT_PROFILES[astronautId] : null;

  const scans = propScans ?? storeScans;
  const [activeMetric, setActiveMetric] = useState<'all' | 'bone' | 'muscle' | 'radiation' | 'cardio'>('all');

  const bScan = scans.baseline;
  const oScan = scans.orbit;
  const pScan = scans.post;

  const getVal = (scan: typeof bScan, id: string): number => {
    const m = scan?.metrics.find((entry) => entry.id === id);
    return m ? Number(m.value.toFixed(1)) : 0;
  };

  const chartData = [
    {
      phaseName: '0. Gün (Fırlatma Öncesi)',
      shortName: '0. Gün',
      bone: getVal(bScan, 'bone'),
      muscle: getVal(bScan, 'muscle'),
      radiation: getVal(bScan, 'radiation'),
      cardio: getVal(bScan, 'cardio'),
      isSimulated: !bScan,
    },
    {
      phaseName: '90. Gün (Yörünge İstasyonu)',
      shortName: '90. Gün',
      bone: getVal(oScan, 'bone') || (astronaut ? +(astronaut.multipliers.boneLoss * 5.4).toFixed(1) : 5.4),
      muscle: getVal(oScan, 'muscle') || (astronaut ? +(astronaut.multipliers.muscleLoss * 6.8).toFixed(1) : 6.8),
      radiation: getVal(oScan, 'radiation') || 45.0,
      cardio: getVal(oScan, 'cardio') || (astronaut ? +(90 - astronaut.multipliers.cardioLoss * 12).toFixed(1) : 78),
      isSimulated: !oScan,
    },
    {
      phaseName: '180. Gün (Dünya İnişi & Dönüş)',
      shortName: '180. Gün',
      bone: getVal(pScan, 'bone') || (astronaut ? +(astronaut.multipliers.boneLoss * 1.9).toFixed(1) : 1.9),
      muscle: getVal(pScan, 'muscle') || (astronaut ? +(astronaut.multipliers.muscleLoss * 2.3).toFixed(1) : 2.3),
      radiation: getVal(pScan, 'radiation') || 45.0,
      cardio: getVal(pScan, 'cardio') || (astronaut ? +(90 - astronaut.multipliers.cardioLoss * 3).toFixed(1) : 87),
      isSimulated: !pScan,
    },
  ];

  return (
    <div
      style={{
        background: 'rgba(8, 22, 36, 0.85)',
        border: '1px solid #1e3a50',
        borderRadius: '10px',
        padding: '16px 20px',
        marginBottom: '20px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)',
      }}
    >
      {/* Header and profile tag */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
          paddingBottom: '10px',
        }}
      >
        <div>
          <span style={{ fontSize: '10px', color: '#38bdf8', letterSpacing: '2px', fontWeight: 700 }}>
            NASA HRP // 180 GÜNLÜK BİYOMETRİK SAĞLIK EĞRİSİ
          </span>
          <h3 style={{ margin: '2px 0 0', fontSize: '15px', color: '#f8fafc', fontWeight: 700 }}>
            Fizyolojik Değişim ve İyileşme Seyri
          </h3>
        </div>

        {astronaut && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 10px',
              borderRadius: '14px',
              background: `${astronaut.badgeColor}18`,
              border: `1px solid ${astronaut.badgeColor}55`,
              fontSize: '11px',
            }}
          >
            <span>{astronaut.avatarIcon}</span>
            <strong style={{ color: astronaut.badgeColor }}>{astronaut.callsign}</strong>
            <span style={{ color: '#94a3b8' }}>({astronaut.name})</span>
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap' }}>
        {[
          { id: 'all', label: 'Tüm Metrikler' },
          { id: 'bone', label: '🦴 Kemik Erimesi (% Kayıp)' },
          { id: 'muscle', label: '💪 Kas Gücü (% Kayıp)' },
          { id: 'cardio', label: '❤️ Kardiyo Kapasitesi (Puan)' },
          { id: 'radiation', label: '☢️ Radyasyon Dozu (mSv)' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveMetric(btn.id as typeof activeMetric)}
            style={{
              padding: '4px 10px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              border: activeMetric === btn.id ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
              background: activeMetric === btn.id ? 'rgba(56, 189, 248, 0.2)' : 'rgba(255, 255, 255, 0.03)',
              color: activeMetric === btn.id ? '#38bdf8' : '#94a3b8',
              transition: 'all 0.15s ease',
            }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div style={{ width: '100%', height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="shortName" stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis stroke="#64748b" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#041624',
                borderColor: '#38bdf8',
                borderRadius: '8px',
                boxShadow: '0 0 16px rgba(56, 189, 248, 0.25)',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#38bdf8', fontWeight: 700, marginBottom: '4px' }}
              labelFormatter={(_, arr) => arr[0]?.payload?.phaseName ?? ''}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

            {(activeMetric === 'all' || activeMetric === 'bone') && (
              <Line
                type="monotone"
                dataKey="bone"
                name="Kemik Kaybı (% BMD)"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#f59e0b', stroke: '#04121e', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'muscle') && (
              <Line
                type="monotone"
                dataKey="muscle"
                name="Kas Kütlesi Kaybı (%)"
                stroke="#ef4444"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#ef4444', stroke: '#04121e', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'cardio') && (
              <Line
                type="monotone"
                dataKey="cardio"
                name="Kardiyo Endeksi (Puan)"
                stroke="#4ade80"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#4ade80', stroke: '#04121e', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}

            {(activeMetric === 'all' || activeMetric === 'radiation') && (
              <Line
                type="monotone"
                dataKey="radiation"
                name="Radyasyon (mSv)"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#38bdf8', stroke: '#04121e', strokeWidth: 2 }}
                activeDot={{ r: 7 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: '8px', fontSize: '10.5px', color: '#64748b', textAlign: 'right' }}>
        * 0-90 gün mikroyerçekimi maruziyeti; 90-180 gün yerçekimine dönüş ve karşı önlem rehabilitasyonu.
      </div>
    </div>
  );
}
