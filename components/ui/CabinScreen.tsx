'use client';

import { useEffect, useState, useRef } from 'react';
import { RADIATION } from '@/lib/health/config';
import type { HealthScan, MetricId, MetricResult } from '@/lib/health/types';
import type { AdviceItem } from '@/lib/health/advice';
import SimulationNotice from './SimulationNotice';
import StatusBadge from './StatusBadge';

/**
 * Animated Real-Time ECG Heart Rate Monitor Line
 */
function LiveECGMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let animId: number;
    let t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      t += 2.2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Subtle background grid
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 15) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      ctx.strokeStyle = '#22c55e';
      ctx.shadowColor = '#4ade80';
      ctx.shadowBlur = 4;
      ctx.lineWidth = 2;
      ctx.beginPath();
      const midY = canvas.height / 2;

      for (let x = 0; x < canvas.width; x += 2) {
        const cycle = (x + t) % 160;
        let y = midY;
        if (cycle > 55 && cycle < 62) y = midY - 5; // P wave
        else if (cycle >= 74 && cycle < 77) y = midY + 4; // Q wave
        else if (cycle >= 77 && cycle < 83) y = midY - 24; // R peak
        else if (cycle >= 83 && cycle < 87) y = midY + 10; // S wave
        else if (cycle >= 105 && cycle < 118) y = midY - 7; // T wave

        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, []);

  return <canvas ref={canvasRef} width={260} height={44} style={{ width: '100%', height: '44px', display: 'block' }} />;
}

export default function CabinScreen({
  scan,
  onClose,
  title = 'Tıbbi kabin',
  advice,
}: {
  scan: HealthScan;
  onClose: () => void;
  title?: string;
  advice?: AdviceItem[];
}) {
  const [selectedId, setSelectedId] = useState<MetricId>(scan.metrics[0]?.id ?? 'radiation');
  const selected = scan.metrics.find((metric) => metric.id === selectedId) ?? scan.metrics[0];

  useEffect(() => setSelectedId(scan.metrics[0]?.id ?? 'radiation'), [scan]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [onClose]);

  if (!selected) return null;

  return (
    <div className="health-overlay" role="dialog" aria-modal="true" aria-labelledby="cabin-title">
      <section className="health-window cabin-window" style={{ maxWidth: '1160px' }}>
        {/* Header */}
        <header className="health-header">
          <div>
            <span className="health-kicker">NASA FLIGHT SURGEON · BİYOTELEMETRİ İSTASYONU // GÜN {scan.missionDay}</span>
            <h1 id="cabin-title" style={{ fontSize: '24px', fontWeight: 600 }}>{title}</h1>
          </div>
          <button className="health-close" onClick={onClose} aria-label="Kabin ekranını kapat">
            Kapat <kbd>Esc</kbd>
          </button>
        </header>

        {/* Live Vital Signs Bar (ECG, Heart Rate, SpO2, Blood Pressure) */}
        <div
          style={{
            marginTop: '16px',
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #071521, #0a1f30)',
            border: '1px solid #38bdf844',
            borderRadius: '6px',
            display: 'grid',
            gridTemplateColumns: 'minmax(240px, 1.3fr) repeat(4, 1fr)',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {/* ECG graph */}
          <div style={{ background: '#030c14', padding: '6px 10px', borderRadius: '4px', border: '1px solid #1e3a4e' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#86efac', marginBottom: '2px' }}>
              <span>CANLI EKG (RİTİM DÖNGÜSÜ)</span>
              <span>SİNÜS RİTMİ: NORMAL</span>
            </div>
            <LiveECGMonitor />
          </div>

          {/* Vitals */}
          <div style={{ background: '#0d2233', padding: '8px 12px', borderRadius: '4px', border: '1px solid #234358' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>NABIZ (HR)</span>
            <strong style={{ fontSize: '18px', color: '#4ade80' }}>
              74 <small style={{ fontSize: '10px', color: '#94a3b8' }}>BPM</small>
            </strong>
          </div>

          <div style={{ background: '#0d2233', padding: '8px 12px', borderRadius: '4px', border: '1px solid #234358' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>OKSİJEN (SpO2)</span>
            <strong style={{ fontSize: '18px', color: '#38bdf8' }}>
              %98 <small style={{ fontSize: '10px', color: '#94a3b8' }}>NOMİNAL</small>
            </strong>
          </div>

          <div style={{ background: '#0d2233', padding: '8px 12px', borderRadius: '4px', border: '1px solid #234358' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>TANSİYON (BP)</span>
            <strong style={{ fontSize: '18px', color: '#f8fafc' }}>
              118/76 <small style={{ fontSize: '10px', color: '#94a3b8' }}>mmHg</small>
            </strong>
          </div>

          <div style={{ background: '#0d2233', padding: '8px 12px', borderRadius: '4px', border: '1px solid #234358' }}>
            <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>GENEL DURUM</span>
            <strong style={{ fontSize: '14px', color: scan.overallStatus === 'green' ? '#4ade80' : scan.overallStatus === 'yellow' ? '#facc15' : '#f87171' }}>
              {scan.overallStatus === 'green' ? 'STABİL' : scan.overallStatus === 'yellow' ? 'GÖZLEM' : 'KRİTİK'}
            </strong>
          </div>
        </div>

        {scan.flightSurgeonAlert && (
          <div className="flight-alert">
            <span aria-hidden="true">✖</span>
            <strong>Uçuş doktoruyla iletişime geç</strong>
            <StatusBadge status="red" />
          </div>
        )}

        {advice && (
          <section className="advice-box" style={{ marginTop: '16px' }}>
            <h2>NASA Uçuş Hekimi Sistem Önerisi · Ne Yapmalısın?</h2>
            <ul>
              {advice.map((item) => (
                <li key={item.text}>
                  <StatusBadge status={item.tone} compact />
                  <span>{item.text}</span>
                  <small>{item.source === 'anket' ? 'Sağlık sorusu' : 'Biyometrik Tarama'}</small>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="cabin-layout">
          {/* Metric Rail */}
          <nav className="metric-rail" aria-label="Sağlık metrikleri">
            {scan.metrics.map((metric) => (
              <button
                key={metric.id}
                className={selected.id === metric.id ? 'selected' : ''}
                onClick={() => setSelectedId(metric.id)}
                style={{
                  borderLeft: selected.id === metric.id ? '3px solid #38bdf8' : '1px solid #47677a55',
                }}
              >
                <span className="metric-rail-copy">
                  <strong>{metric.name}</strong>
                  <span style={{ fontSize: '11px', color: '#38bdf8' }}>{metric.displayValue}</span>
                </span>
                <StatusBadge status={metric.status} compact />
              </button>
            ))}
          </nav>

          {/* Metric Detail */}
          <article className="metric-detail" style={{ background: '#061422fa', border: '1px solid #38bdf844' }}>
            <div className="detail-title-row">
              <div>
                <span className="health-kicker">{selected.cabin.title}</span>
                <h2 style={{ fontSize: '20px', color: '#f8fafc', marginTop: '4px' }}>{selected.name}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>{selected.displayValue}</span>
                <StatusBadge status={selected.status} />
              </div>
            </div>

            {selected.pending && <span className="draft-label">Taslak içerik</span>}
            <p className="detail-copy" style={{ fontSize: '13px', lineHeight: '1.7', color: '#cbd5e1' }}>
              {selected.cabin.detail}
            </p>

            {selected.id === 'radiation' && <RadiationGauge metric={selected} />}

            <section className="detail-section">
              <h3>NASA Risk Tanımı</h3>
              <p>{selected.cabin.nasaRiskName}</p>
            </section>

            <DetailList title="Tehlikeler" items={selected.cabin.hazards} />
            <DetailList title="Olası Sağlık Sorunları" items={selected.cabin.conditions} />
            <DetailList title="Tıbbi Müdahale & Karşı Önlem" items={selected.cabin.advice} />

            <section className="detail-section">
              <h3>Bilimsel Kaynaklar & Literatür</h3>
              {selected.cabin.sources.length ? (
                <ul className="source-list">
                  {selected.cabin.sources.map((source) => (
                    <li key={source.label}>
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noreferrer">
                          {source.label}
                          <span aria-hidden="true"> ↗</span>
                        </a>
                      ) : (
                        <span>{source.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Kaynak eklenmedi.</p>
              )}
            </section>
          </article>
        </div>

        <SimulationNotice />
      </section>
    </div>
  );
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {items.length ? (
        <ul className="detail-list">
          {items.map((item) => (
            <li key={item} style={{ background: '#0b2133', borderColor: '#2e5066' }}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p>Bilgi eklenmedi.</p>
      )}
    </section>
  );
}

function RadiationGauge({ metric }: { metric: MetricResult }) {
  const percent = Math.min(100, Math.max(0, (metric.value / RADIATION.careerLimitMSv) * 100));
  return (
    <section className="radiation-gauge" style={{ background: '#081c2e', border: '1px solid #38bdf844' }}>
      <div className="gauge-copy">
        <span style={{ color: '#94a3b8' }}>Kümülatif Kariyer Limiti (NASA Bariatric)</span>
        <strong>
          {metric.displayValue} / {RADIATION.careerLimitMSv} mSv
        </strong>
      </div>
      <div
        className="gauge-track"
        role="progressbar"
        aria-label="Kariyer radyasyon limiti"
        aria-valuemin={0}
        aria-valuemax={RADIATION.careerLimitMSv}
        aria-valuenow={Math.min(metric.value, RADIATION.careerLimitMSv)}
      >
        <span style={{ width: percent + '%' }} />
      </div>
      <small style={{ color: '#38bdf8' }}>Limitin %{metric.careerLimitPercent ?? 0} kadarı doldu</small>
    </section>
  );
}
