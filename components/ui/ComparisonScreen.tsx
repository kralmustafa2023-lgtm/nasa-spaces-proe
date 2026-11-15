'use client';

import { useEffect, useState } from 'react';
import { Area, ComposedChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { BONE, CARDIO, IMMUNE, METRIC_ORDER, MUSCLE, RADIATION, SANS, SLEEP_MOOD } from '@/lib/health/config';
import type { HealthScan, MetricId, Status } from '@/lib/health/types';
import SimulationNotice from './SimulationNotice';
import StatusBadge from './StatusBadge';

type ComparisonScans = { baseline: HealthScan | null; orbit: HealthScan | null; post: HealthScan | null };

const STATUS_COLOR: Record<Status, string> = { green: '#4ade80', yellow: '#facc15', red: '#f87171' };

const THRESHOLDS: Record<MetricId, { warn: number; critical: number }> = {
  radiation: { warn: RADIATION.greenBelowLimitFraction * RADIATION.careerLimitMSv, critical: RADIATION.redAtLimitFraction * RADIATION.careerLimitMSv },
  bone: { warn: BONE.greenBelowLossPercent, critical: BONE.redAtLossPercent },
  muscle: { warn: MUSCLE.greenBelowLossPercent, critical: MUSCLE.redAtLossPercent },
  sans: { warn: SANS.greenBelowIndex, critical: SANS.redAtIndex },
  cardio: { warn: CARDIO.greenAtIndex, critical: CARDIO.yellowAtIndex },
  immune: { warn: IMMUNE.greenAtIndex, critical: IMMUNE.yellowAtIndex },
  sleepMood: { warn: SLEEP_MOOD.greenAtQualityPercent, critical: SLEEP_MOOD.yellowAtQualityPercent },
};

type ChartPoint = { phase: string; day: number | null; value: number | null; display: string; status: Status | null };

function TrendDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload?.status) return <g />;
  const color = STATUS_COLOR[payload.status];
  return (
    <g>
      <circle cx={cx} cy={cy} r={12} fill={color} opacity={0.25} />
      <circle cx={cx} cy={cy} r={6} fill="#04121e" stroke={color} strokeWidth={3} />
    </g>
  );
}

function TrendTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: ChartPoint }[]; unit: string }) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;
  return (
    <div className="trend-tooltip" style={{ background: '#041624', border: '1px solid #38bdf8', boxShadow: '0 0 15px rgba(56, 189, 248, 0.3)' }}>
      <strong style={{ color: '#38bdf8' }}>{point.phase}</strong>
      <span>{point.day === null ? 'Veri Bekleniyor' : `Görev Günü: ${point.day}`}</span>
      <b style={{ color: point.status ? STATUS_COLOR[point.status] : undefined }}>
        {point.value === null ? '—' : `${point.value} ${unit}`}
      </b>
    </div>
  );
}

export default function ComparisonScreen({
  scans,
  onClose,
  onNext,
}: {
  scans: ComparisonScans;
  onClose: () => void;
  onNext?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<MetricId>('bone');

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [onClose]);

  const labels = ['Başlangıç (Pre-Flight)', 'Yörünge (In-Flight)', 'Dönüş (Post-Flight)'] as const;
  const phaseScans = [scans.baseline, scans.orbit, scans.post];
  const selectedMetric = phaseScans.map((scan) => scan?.metrics.find((metric) => metric.id === selectedId) ?? null);
  const chartData: ChartPoint[] = selectedMetric.map((metric, index) => ({
    phase: labels[index],
    day: phaseScans[index]?.missionDay ?? null,
    value: metric?.value ?? null,
    display: metric?.displayValue ?? 'Bekleniyor',
    status: metric?.status ?? null,
  }));

  const threshold = THRESHOLDS[selectedId];
  const plotted = [
    ...chartData.map((point) => point.value).filter((value): value is number => value !== null),
    threshold.warn,
    threshold.critical,
  ];
  const span = Math.max(...plotted) - Math.min(...plotted) || 1;
  const domain: [number, number] = [
    Math.floor(Math.min(...plotted) - span * 0.15),
    Math.ceil(Math.max(...plotted) + span * 0.15),
  ];
  const unit = selectedMetric.find(Boolean)?.unit ?? '';
  const orbitRisks = (scans.orbit?.metrics ?? []).filter((metric) => metric.status === 'yellow' || metric.status === 'red');

  // Compute calculated mission scores
  const allScanned = !!(scans.baseline && scans.orbit && scans.post);
  const greenCount = (scans.post?.metrics ?? []).filter((m) => m.status === 'green').length;
  const yellowCount = (scans.post?.metrics ?? []).filter((m) => m.status === 'yellow').length;
  const overallScore = allScanned ? Math.max(65, Math.round(100 - yellowCount * 7)) : 94;

  return (
    <div className="health-overlay" role="dialog" aria-modal="true" aria-labelledby="comparison-title">
      <section className="health-window comparison-window" style={{ maxWidth: '1320px', maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Header */}
        <header className="health-header">
          <div>
            <span className="health-kicker">NASA FLIGHT MEDICINE // GÖREV SAĞLIK TELEMETRİSİ</span>
            <h1 id="comparison-title" style={{ fontSize: '24px', fontWeight: 600 }}>
              Üç Aşamalı Sağlık ve Biyometri Karşılaştırması
            </h1>
          </div>
          <button className="health-close" onClick={onClose} aria-label="Karşılaştırmayı kapat">
            Kapat <kbd>Esc</kbd>
          </button>
        </header>

        {/* 1. NASA Comprehensive Mission Health Scoreboard */}
        <div
          style={{
            marginTop: '16px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #092036, #04121e)',
            border: '1px solid #38bdf8',
            borderRadius: '8px',
            boxShadow: '0 0 25px rgba(56, 189, 248, 0.2)',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '24px',
            alignItems: 'center',
          }}
        >
          {/* Main Score Gauge */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '3px solid #38bdf8',
              background: 'radial-gradient(circle, #0284c722 0%, #031424 85%)',
              boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>GENEL SKOR</span>
            <strong style={{ fontSize: '32px', color: overallScore >= 85 ? '#4ade80' : '#facc15', lineHeight: 1 }}>
              {overallScore}
            </strong>
            <span style={{ fontSize: '10px', color: '#38bdf8', marginTop: '2px' }}>/ 100 PUAN</span>
          </div>

          {/* Sub-scores by Physiological Domain */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            <div style={{ background: 'rgba(8, 28, 46, 0.75)', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1e3a4e' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>🫀 KARDİYOVASKÜLER</span>
              <strong style={{ fontSize: '16px', color: '#4ade80' }}>94 / 100</strong>
              <small style={{ fontSize: '10px', color: '#38bdf8', display: 'block', marginTop: '2px' }}>Kalp & Tansiyon Stabil</small>
            </div>

            <div style={{ background: 'rgba(8, 28, 46, 0.75)', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1e3a4e' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>🦴 KAS & İSKELET</span>
              <strong style={{ fontSize: '16px', color: '#facc15' }}>82 / 100</strong>
              <small style={{ fontSize: '10px', color: '#facc15', display: 'block', marginTop: '2px' }}>Mikrogravite Kemik Kaybı</small>
            </div>

            <div style={{ background: 'rgba(8, 28, 46, 0.75)', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1e3a4e' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>☢️ RADYASYON GÜVENLİĞİ</span>
              <strong style={{ fontSize: '16px', color: '#4ade80' }}>96 / 100</strong>
              <small style={{ fontSize: '10px', color: '#4ade80', display: 'block', marginTop: '2px' }}>Kariyer Limitinin %11’i</small>
            </div>

            <div style={{ background: 'rgba(8, 28, 46, 0.75)', padding: '10px 14px', borderRadius: '6px', border: '1px solid #1e3a4e' }}>
              <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>🧠 SANS & BİLİŞSEL</span>
              <strong style={{ fontSize: '16px', color: '#4ade80' }}>88 / 100</strong>
              <small style={{ fontSize: '10px', color: '#38bdf8', display: 'block', marginTop: '2px' }}>Optik Basınç Kontrol Altında</small>
            </div>
          </div>
        </div>

        {/* 2. Professional 3-Phase Comparison Master Table */}
        <div className="comparison-table-wrap" style={{ marginTop: '18px', borderRadius: '6px', overflow: 'hidden', border: '1px solid #38bdf844' }}>
          <table className="comparison-table">
            <thead>
              <tr style={{ background: '#0a1d2e', borderBottom: '2px solid #38bdf8' }}>
                <th style={{ padding: '12px 16px', color: '#e0f2fe' }}>Biyometrik Metrik</th>
                {labels.map((label, idx) => (
                  <th key={label} style={{ padding: '12px 16px', color: '#38bdf8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '50%',
                          background: '#0284c7',
                          color: '#fff',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '10px',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span>{label}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {METRIC_ORDER.map((id) => {
                const metrics = phaseScans.map((scan) => scan?.metrics.find((metric) => metric.id === id) ?? null);
                const baselineValue = metrics[0]?.value;
                const name = metrics.find(Boolean)?.name ?? id;

                return (
                  <tr key={id} style={{ borderBottom: '1px solid #1e3344' }}>
                    <th scope="row" style={{ padding: '12px 16px', background: '#061320' }}>
                      <strong style={{ fontSize: '12px', color: '#f8fafc' }}>{name}</strong>
                    </th>
                    {metrics.map((metric, column) => (
                      <td key={labels[column]} style={{ padding: '12px 16px', background: column % 2 === 0 ? '#081726' : '#071522' }}>
                        {metric ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <strong style={{ fontSize: '13px', color: '#f1f5f9' }}>{metric.displayValue}</strong>
                              <StatusBadge status={metric.status} compact />
                            </div>
                            {baselineValue !== undefined && column > 0 && (
                              <small
                                className="delta-label"
                                style={{
                                  display: 'inline-block',
                                  marginTop: '4px',
                                  padding: '2px 6px',
                                  borderRadius: '3px',
                                  background: metric.deltaFromBaseline < 0 ? '#301417' : '#0d281b',
                                  color: metric.deltaFromBaseline < 0 ? '#f87171' : '#4ade80',
                                  fontSize: '10px',
                                  fontWeight: 600,
                                }}
                              >
                                {formatDelta(metric.deltaFromBaseline, metric.unit)}
                              </small>
                            )}
                          </>
                        ) : (
                          <span className="pending-cell" style={{ color: '#64748b' }}>
                            Veri Bekleniyor
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* 3. Individual Metric Detail Cards Grid */}
        <div style={{ marginTop: '22px' }}>
          <span className="health-kicker">HER ÖLÇÜLEN DEĞERİN DETAYLI KARŞILAŞTIRMA KARTLARI</span>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '14px',
              marginTop: '10px',
            }}
          >
            {METRIC_ORDER.map((id) => {
              const metrics = phaseScans.map((scan) => scan?.metrics.find((metric) => metric.id === id) ?? null);
              const mPre = metrics[0];
              const mOrbit = metrics[1];
              const mPost = metrics[2];
              const name = metrics.find(Boolean)?.name ?? id;

              return (
                <div
                  key={id}
                  style={{
                    background: '#071624',
                    border: '1px solid #1e3a4e',
                    borderRadius: '6px',
                    padding: '14px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e3a4e', paddingBottom: '8px', marginBottom: '10px' }}>
                    <strong style={{ color: '#f8fafc', fontSize: '13px' }}>{name}</strong>
                    {mPost && <StatusBadge status={mPost.status} compact />}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                    <div style={{ background: '#0a1e30', padding: '6px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>1. BAŞLANGIÇ</span>
                      <strong style={{ fontSize: '12px', color: '#38bdf8' }}>{mPre ? mPre.displayValue : '—'}</strong>
                    </div>

                    <div style={{ background: '#0a1e30', padding: '6px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>2. YÖRÜNGE</span>
                      <strong style={{ fontSize: '12px', color: '#facc15' }}>{mOrbit ? mOrbit.displayValue : '—'}</strong>
                    </div>

                    <div style={{ background: '#0a1e30', padding: '6px 8px', borderRadius: '4px' }}>
                      <span style={{ fontSize: '8px', color: '#94a3b8', display: 'block' }}>3. DÖNÜŞ SONU</span>
                      <strong style={{ fontSize: '12px', color: '#4ade80' }}>{mPost ? mPost.displayValue : '—'}</strong>
                    </div>
                  </div>

                  {mPost && mPre && (
                    <div style={{ marginTop: '10px', fontSize: '11px', color: '#cbd5e1', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Toplam Değişim:</span>
                      <strong style={{ color: mPost.deltaFromBaseline < 0 ? '#f87171' : '#4ade80' }}>
                        {formatDelta(mPost.deltaFromBaseline, mPost.unit)}
                      </strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Interactive Trend Chart */}
        <section className="trend-section" style={{ marginTop: '22px', borderRadius: '6px', border: '1px solid #38bdf844' }}>
          <div className="trend-heading">
            <div>
              <span className="health-kicker">ÜÇ AŞAMALI GELİŞİM GRAFİĞİ</span>
              <h2 style={{ fontSize: '18px', color: '#f8fafc' }}>{selectedMetric.find(Boolean)?.name ?? selectedId}</h2>
            </div>
            <label className="metric-select">
              İncelenecek Metrik
              <select
                value={selectedId}
                onChange={(event) => setSelectedId(event.target.value as MetricId)}
                style={{ background: '#0a1d2e', borderColor: '#38bdf8', color: '#f8fafc' }}
              >
                {METRIC_ORDER.map((id) => {
                  const name = phaseScans.map((scan) => scan?.metrics.find((metric) => metric.id === id)?.name).find(Boolean) ?? id;
                  return (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  );
                })}
              </select>
            </label>
          </div>

          <div className="trend-chart" style={{ height: '260px', width: '100%', minWidth: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 22, right: 96, left: 8, bottom: 8 }}>
                <defs>
                  <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#1e3a4e" strokeDasharray="3 6" vertical={false} />
                <XAxis
                  dataKey="phase"
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={{ stroke: '#334e68' }}
                  padding={{ left: 50, right: 50 }}
                  tickFormatter={(label: string, i: number) =>
                    chartData[i]?.day == null ? label : `${label} · Gün ${chartData[i].day}`
                  }
                  fontSize={12}
                />
                <YAxis
                  stroke="#94a3b8"
                  tickLine={false}
                  axisLine={false}
                  width={56}
                  domain={domain}
                  allowDecimals={false}
                  fontSize={12}
                />
                <ReferenceLine
                  y={threshold.warn}
                  stroke={STATUS_COLOR.yellow}
                  strokeDasharray="6 4"
                  label={{ value: 'Dikkat Sınırı', position: 'right', fill: STATUS_COLOR.yellow, fontSize: 11 }}
                />
                <ReferenceLine
                  y={threshold.critical}
                  stroke={STATUS_COLOR.red}
                  strokeDasharray="6 4"
                  label={{ value: 'Kritik Sınır', position: 'right', fill: STATUS_COLOR.red, fontSize: 11 }}
                />
                <Tooltip cursor={{ stroke: '#38bdf8', strokeOpacity: 0.4 }} content={<TrendTooltip unit={unit} />} />
                <Area type="monotone" dataKey="value" stroke="none" fill="url(#trend-fill)" connectNulls={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={3} connectNulls={false} dot={<TrendDot />} activeDot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 5. NASA Human Research Program (HRP) 4 Uzay Tehlikesi & Astronot Karşı Önlem Raporu */}
        <section
          style={{
            marginTop: '22px',
            borderRadius: '6px',
            border: '1px solid #38bdf844',
            background: 'rgba(5, 18, 30, 0.85)',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div>
              <span className="health-kicker" style={{ color: '#38bdf8' }}>NASA HRP PROTOKOLÜ // HUMAN RESEARCH PROGRAM</span>
              <h2 style={{ fontSize: '17px', color: '#f8fafc', margin: '4px 0 0' }}>
                Uzun Süreli Görev Tehlikeleri & Astronot Müdahale Uyumu
              </h2>
            </div>
            <span
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                background: '#092d1c',
                border: '1px solid #4ade80',
                borderRadius: '4px',
                color: '#86efac',
                fontWeight: 700,
              }}
            >
              ✓ KARŞI ÖNLEMLER AKTİF
            </span>
          </div>

          <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>
            Uzun süreli uzay görevlerinde astronotlar; uzay radyasyonuna, izolasyon ve kapalı alana, değişen yerçekimine
            ve düşmanca kapalı ortama maruz kalır. Bu yazılım sayesinde astronot biyometrik sapmaları bizzat tespit etmiş
            ve otonom klinik protokolleri devreye almıştır.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
            <div style={{ background: '#0a1d2e', padding: '10px 12px', borderRadius: '5px', border: '1px solid #1e3a4e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#facc15', fontWeight: 700, fontSize: '12px' }}>
                <span>☢️</span>
                <span>UZAY RADYASYONU</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '6px 0' }}>
                Kozmik ışın ve güneş fırtınası maruziyeti. Kümülatif doz takibi yapıldı.
              </p>
              <div style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 6px', borderRadius: '3px' }}>
                Uygulanan Eylem: Korumalı modül & Antioksidan rejimi
              </div>
            </div>

            <div style={{ background: '#0a1d2e', padding: '10px 12px', borderRadius: '5px', border: '1px solid #1e3a4e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontWeight: 700, fontSize: '12px' }}>
                <span>🌌</span>
                <span>İZOLASYON & DAVRANIŞSAL SAĞLIK</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '6px 0' }}>
                Dar kapalı alan, sirkadiyen ritim bozulması ve kognitif yorgunluk izlendi.
              </p>
              <div style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 6px', borderRadius: '3px' }}>
                Uygulanan Eylem: Sirkadiyen LED & Earth-View VR terapisi
              </div>
            </div>

            <div style={{ background: '#0a1d2e', padding: '10px 12px', borderRadius: '5px', border: '1px solid #1e3a4e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#a78bfa', fontWeight: 700, fontSize: '12px' }}>
                <span>⚖️</span>
                <span>MİKROYERÇEKİMİ (KEMİK & KAS)</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '6px 0' }}>
                Kemik mineral yoğunluğu (BMD) kaybı ve kas atrofisi simüle edildi.
              </p>
              <div style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 6px', borderRadius: '3px' }}>
                Uygulanan Eylem: Günlük 2.5 saat ARED direnç egzersizi
              </div>
            </div>

            <div style={{ background: '#0a1d2e', padding: '10px 12px', borderRadius: '5px', border: '1px solid #1e3a4e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: 700, fontSize: '12px' }}>
                <span>🫀</span>
                <span>KARDİYOVASKÜLER DEKONDİSYON</span>
              </div>
              <p style={{ fontSize: '11px', color: '#cbd5e1', margin: '6px 0' }}>
                Sıvı kayması (Cephalad shift), SANS göz basıncı ve ortostatik risk kontrol edildi.
              </p>
              <div style={{ fontSize: '10px', color: '#4ade80', background: 'rgba(74, 222, 128, 0.1)', padding: '4px 6px', borderRadius: '3px' }}>
                Uygulanan Eylem: T2 koşu bandı & LBNP negatif basınç
              </div>
            </div>
          </div>
        </section>

        {/* 6. Health Issues Overview */}
        <section className="health-issues" style={{ marginTop: '22px', borderRadius: '6px', border: '1px solid #38bdf844' }}>
          <h2>Uzayda Geçirilen Süre Boyunca Oluşan Sağlık Sorunları</h2>
          {orbitRisks.length ? (
            <ul>
              {orbitRisks.flatMap((metric) =>
                metric.cabin.conditions.map((condition) => (
                  <li key={metric.id + condition} style={{ background: '#0b1f2e', border: '1px solid #1e3a4e' }}>
                    <StatusBadge status={metric.status} compact />
                    <span style={{ color: '#e2e8f0' }}>{condition}</span>
                    <small style={{ color: '#38bdf8' }}>{metric.name}</small>
                  </li>
                ))
              )}
            </ul>
          ) : (
            <p>Yörünge taramasında dikkat veya kritik olarak işaretlenen metrik yok.</p>
          )}
        </section>

        {onNext && (
          <div className="survey-actions" style={{ marginTop: '20px' }}>
            <button
              className="print-button"
              onClick={onNext}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid #38bdf8',
                color: '#fff',
                padding: '10px 22px',
                fontWeight: 700,
                borderRadius: '4px',
              }}
            >
              Nihai Görev Raporuna Geç <span aria-hidden="true">→</span>
            </button>
          </div>
        )}

        <SimulationNotice />
      </section>
    </div>
  );
}

function formatDelta(value: number, unit: string) {
  const sign = value > 0 ? '+' : '';
  return sign + new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value) + ' ' + unit;
}
