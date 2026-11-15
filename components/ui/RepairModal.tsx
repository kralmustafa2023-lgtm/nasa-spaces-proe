'use client';

import { useState, useEffect, useRef } from 'react';

export interface RepairDetails {
  id: string;
  name: string;
  sub: string;
  problem: string;
  metrics: { label: string; value: string; warn?: boolean }[];
  steps: string[];
}

export const REPAIR_INFO: Record<string, RepairDetails> = {
  power: {
    id: 'power',
    name: 'GÜÇ DAĞITIM VE REGÜLATÖR ÜNİTESİ (PDU-1)',
    sub: 'KRİTİK ARIZA // BARA GERİLİMİ ÇÖKTÜ',
    problem:
      '1B Güneş Paneli regülatör devresinde aşırı gerilim dalgalanması yaşandı. Ana güç barası (Bus-A) aşırı yük korumasıyla kilitlendi. İstasyon acil durum bataryalarında ve güç rezervi hızla tükeniyor.',
    metrics: [
      { label: 'Bara Voltajı', value: '18.4 V / 120 V', warn: true },
      { label: 'Faz Dengesizliği', value: '%78.2 Sapma', warn: true },
      { label: 'Batarya Rezervi', value: '14 Dakika', warn: true },
      { label: 'Panel Verimi', value: '%12', warn: true },
    ],
    steps: [
      'Aşırı yüklenen PDU-1 ana bara kesicisini ve sigortayı sıfırla',
      'Güneş paneli rotasyon sürücüsünü (BAPTA) acil güç moduna al',
      'DC-DC dönüştürücüleri senkronize et ve akımı ana hatta bağla',
    ],
  },
  oxygen: {
    id: 'oxygen',
    name: 'YAŞAM DESTEK VE OKSİJEN JENERATÖRÜ (OGS-2)',
    sub: 'KRİTİK ARIZA // O2 ÜRETİMİ DURDU',
    problem:
      'Mikrogravite su ayrıştırma elektroliz hücresinde gaz kabarcığı tıkanması tespit edildi. Oksijen üretim verimi %28 seviyesine geriledi, kabin CO2 seviyesi tehlikeli sınıra yaklaşıyor.',
    metrics: [
      { label: 'Kabin O2 Seviyesi', value: '%18.1 (Düşüşte)', warn: true },
      { label: 'Kabin CO2', value: '6.4 mmHg', warn: true },
      { label: 'Elektroliz Basıncı', value: '4.8 bar (Aşırı)', warn: true },
      { label: 'Hava Dolaşımı', value: '110 L/dk', warn: false },
    ],
    steps: [
      'Elektroliz su besleme pompasını geri temizleme döngüsüne al',
      'Katı amin CO2 filtre membranlarını ters hava akımıyla tahliye et',
      'Kabin hava dolaşım fanlarını maksimum devirde yeniden başlat',
    ],
  },
  comms: {
    id: 'comms',
    name: 'YÜKSEK KAZANÇLI KU-BAND İLETİŞİM ANTENİ',
    sub: 'KRİTİK ARIZA // TELEMETRİ KOPUK',
    problem:
      'TDRS (İzleme ve Veri İletim Uydusu) takip motoru mikro-meteoroid çarpması sonucu kilitlendi. Houston JSC Görev Kontrol ile doğrudan telemetri, acil durum veri kanalı ve canlı video yayını kesildi.',
    metrics: [
      { label: 'Sinyal Gücü', value: '-88 dBm (LOS)', warn: true },
      { label: 'Gimbal Açısı', value: '+18.4° Sapma', warn: true },
      { label: 'Paket Kaybı', value: '%100', warn: true },
      { label: 'TDRS Uydusu', value: 'Kilitlenemedi', warn: true },
    ],
    steps: [
      'Anten gimbal motorunun mekanik aşırı yük kilidini devreden çıkar',
      'Faz dizilimli RF alıcı-vericisini TDRS-Doğu uydusuna otomatik hizala',
      'Şifreli NASA JSC telemetri el sıkışmasını (handshake) doğrula',
    ],
  },
};

interface RepairModalProps {
  repairId: string;
  onComplete: () => void;
  onClose: () => void;
}

export default function RepairModal({ repairId, onComplete, onClose }: RepairModalProps) {
  const data = REPAIR_INFO[repairId] ?? REPAIR_INFO.power;
  const [isRepairing, setIsRepairing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Animated Telemetry / Oscilloscope Waveform
  useEffect(() => {
    let animId: number;
    let t = 0;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      t += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid background
      ctx.strokeStyle = 'rgba(70, 110, 140, 0.18)';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 15) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Waveform line: erratic red when broken, smooth glowing cyan/green when fixed
      ctx.beginPath();
      const midY = canvas.height / 2;
      const color = isDone ? '#4ade80' : isRepairing ? '#facc15' : '#f87171';
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;

      for (let x = 0; x < canvas.width; x += 2) {
        let yOffset = 0;
        if (isDone) {
          // Smooth stable harmonic wave
          yOffset = Math.sin((x * 0.04) + t * 2) * 16;
        } else if (isRepairing) {
          // Stabilizing wave with progress dampening
          const jitter = (1 - progress / 100) * 14;
          yOffset =
            Math.sin((x * 0.05) + t * 3) * 18 +
            (Math.sin(x * 0.2 + t * 5) * jitter);
        } else {
          // Erratic chaotic spike wave (damaged system)
          yOffset =
            Math.sin((x * 0.03) + t) * 12 +
            (Math.sin((x * 0.12) + t * 4) * 15) +
            (x % 35 === 0 ? (Math.random() - 0.5) * 30 : 0);
        }
        const y = midY + yOffset;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isRepairing, isDone, progress]);

  // Handle repair start & step-by-step progress
  const startRepair = () => {
    if (isRepairing || isDone) return;
    setIsRepairing(true);
    setProgress(0);
    setActiveStep(1);

    const totalDuration = 3600; // 3.6s
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / totalDuration) * 100));
      setProgress(pct);

      if (pct >= 33 && pct < 66) {
        setActiveStep(2);
      } else if (pct >= 66 && pct < 100) {
        setActiveStep(3);
      } else if (pct >= 100) {
        clearInterval(interval);
        setIsDone(true);
        setActiveStep(4);
        setTimeout(() => {
          onComplete();
        }, 1200);
      }
    }, 40);
  };

  // Keyboard shortcut: E to trigger repair or Esc to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        if (!isRepairing && !isDone) {
          e.preventDefault();
          startRepair();
        }
      } else if (e.key === 'Escape') {
        if (!isRepairing) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRepairing, isDone]);

  return (
    <div className="health-overlay" role="dialog" aria-modal="true" style={{ zIndex: 9999 }}>
      <div
        className="health-window"
        style={{
          width: 'min(780px, 95vw)',
          border: isDone ? '1px solid #4ade80' : '1px solid #f8717188',
          boxShadow: isDone ? '0 0 50px rgba(74, 222, 128, 0.25)' : '0 0 50px rgba(248, 113, 113, 0.25)',
        }}
      >
        {/* Header */}
        <header className="health-header" style={{ borderColor: isDone ? '#4ade8055' : '#f8717144' }}>
          <div>
            <span className="health-kicker" style={{ color: isDone ? '#4ade80' : '#f87171' }}>
              NASA-ISS ARIN // TEŞHİS VE ONARIM PROTOKOLÜ
            </span>
            <h1 style={{ fontSize: '20px', color: '#f8fafc', marginTop: '4px' }}>{data.name}</h1>
            <div style={{ fontSize: '11px', color: isDone ? '#4ade80' : '#f87171', fontWeight: 600, marginTop: '3px' }}>
              {isDone ? '✓ ONARILDI · SİSTEM NOMİNAL VE AKTİF' : data.sub}
            </div>
          </div>
          <button className="health-close" onClick={onClose} disabled={isRepairing && !isDone}>
            Kapat <kbd>Esc</kbd>
          </button>
        </header>

        {/* Diagnostic Waveform & Telemetry */}
        <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
          {/* Waveform Screen */}
          <div
            style={{
              background: '#040d16',
              border: '1px solid #324c5e',
              padding: '10px',
              borderRadius: '4px',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#7dd3fc', marginBottom: '6px' }}>
              <span>OSİLOSKOP SİNYAL AKIŞI (CH-1)</span>
              <span>{isDone ? 'DURUM: SENKRONİZE' : isRepairing ? 'KALİBRE EDİLİYOR...' : 'DURUM: BOZUK'}</span>
            </div>
            <canvas ref={canvasRef} width={380} height={110} style={{ width: '100%', height: '110px', display: 'block' }} />
          </div>

          {/* Quick Metrics Grid */}
          <div
            style={{
              background: '#081724',
              border: '1px solid #355368',
              padding: '10px 14px',
              borderRadius: '4px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '8px',
            }}
          >
            {data.metrics.map((m, idx) => (
              <div key={idx} style={{ background: '#0d2233', padding: '6px 8px', border: '1px solid #233e50' }}>
                <span style={{ fontSize: '9px', color: '#94a3b8', display: 'block' }}>{m.label}</span>
                <strong
                  style={{
                    fontSize: '12px',
                    color: isDone ? '#4ade80' : m.warn ? '#f87171' : '#e2e8f0',
                  }}
                >
                  {isDone ? 'NOMİNAL' : m.value}
                </strong>
              </div>
            ))}
          </div>
        </div>

        {/* Problem Description */}
        <div
          style={{
            marginTop: '14px',
            background: isDone ? '#092518' : '#221114',
            border: isDone ? '1px solid #4ade8055' : '1px solid #f8717155',
            padding: '12px 14px',
            borderRadius: '4px',
          }}
        >
          <span style={{ fontSize: '10px', fontWeight: 700, color: isDone ? '#4ade80' : '#fca5a5', display: 'block', marginBottom: '4px' }}>
            SORUN NEDİR? (ARIZA TEŞHİS RAPORU)
          </span>
          <p style={{ margin: 0, fontSize: '12px', lineHeight: '1.6', color: '#e2e8f0' }}>{data.problem}</p>
        </div>

        {/* Action Steps Sequence */}
        <div style={{ marginTop: '14px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#38bdf8', letterSpacing: '1px' }}>
            GEREKLİ ONARIM ADIMLARI
          </span>
          <div style={{ display: 'grid', gap: '8px', marginTop: '8px' }}>
            {data.steps.map((step, idx) => {
              const stepNumber = idx + 1;
              const isStepDone = isDone || activeStep > stepNumber;
              const isStepActive = isRepairing && activeStep === stepNumber;

              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 12px',
                    background: isStepDone ? '#0d281b' : isStepActive ? '#2c270d' : '#081724',
                    border: isStepDone ? '1px solid #4ade80' : isStepActive ? '1px solid #facc15' : '1px solid #284457',
                    borderRadius: '4px',
                    color: isStepDone ? '#4ade80' : isStepActive ? '#fef08a' : '#cbd5e1',
                    fontSize: '12px',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isStepDone ? '#4ade80' : isStepActive ? '#facc15' : '#1e3446',
                      color: isStepDone || isStepActive ? '#020617' : '#94a3b8',
                      fontWeight: 700,
                      fontSize: '11px',
                      flexShrink: 0,
                    }}
                  >
                    {isStepDone ? '✓' : stepNumber}
                  </span>
                  <span>{step}</span>
                  {isStepActive && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#facc15', fontStyle: 'italic' }}>
                      Uygulanıyor...
                    </span>
                  )}
                  {isStepDone && (
                    <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#4ade80', fontWeight: 600 }}>
                      Tamamlandı
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Bar (during repair) */}
        {isRepairing && !isDone && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#facc15', marginBottom: '6px' }}>
              <span>ONARIM İŞLEMİ SÜRÜYOR · BEKLEYİN...</span>
              <strong>%{progress}</strong>
            </div>
            <div style={{ height: '8px', background: '#102534', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #facc15, #4ade80)',
                  transition: 'width 80ms ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Success Banner */}
        {isDone && (
          <div
            style={{
              marginTop: '16px',
              padding: '12px',
              background: '#092d1c',
              border: '1px solid #4ade80',
              borderRadius: '4px',
              textAlign: 'center',
              color: '#4ade80',
              fontWeight: 700,
              fontSize: '14px',
              letterSpacing: '1px',
            }}
          >
            ✓ ONARIM BAŞARIYLA TAMAMLANDI! SİSTEM DEVREYE ALINDI.
          </div>
        )}

        {/* Action Button */}
        {!isRepairing && !isDone && (
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              onClick={startRepair}
              style={{
                background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                border: '1px solid #38bdf8',
                color: '#f8fafc',
                padding: '10px 22px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(56, 189, 248, 0.4)',
              }}
            >
              <span>ONARIMI BAŞLAT</span>
              <kbd style={{ background: '#082f49', border: '1px solid #38bdf8', padding: '2px 6px', fontSize: '10px' }}>E</kbd>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
