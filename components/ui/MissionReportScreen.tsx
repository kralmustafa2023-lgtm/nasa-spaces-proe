'use client';

import { useEffect } from 'react';
import type { MissionReport } from '@/lib/health/types';
import SimulationNotice from './SimulationNotice';
import StatusBadge from './StatusBadge';

const MISSION_REPORT_SOURCES: string[] = [
  'https://www.nasa.gov/hrp/hazards/',
  'https://www.nasa.gov/hrp/risks/',
  'https://www.nasa.gov/hrp/ongoing-hrp-research/',
  'https://www.asc-csa.gc.ca/eng/news/articles/2026/2026-02-26-monitoring-radiation-astronaut-health.asp',
  'https://www.asc-csa.gc.ca/eng/iss/science/why-do-we-conduct-science-experiments-in-space.asp',
  'https://science.nasa.gov/3d-resources/',
];

export default function MissionReportScreen({ report, onClose }: { report: MissionReport; onClose: () => void }) {
  useEffect(() => {
    const down = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', down);
    return () => window.removeEventListener('keydown', down);
  }, [onClose]);

  return <div className="health-overlay" role="dialog" aria-modal="true" aria-labelledby="report-title">
    <section className="health-window report-window">
      <header className="health-header">
        <div><span className="health-kicker">GÖREV RAPORU / {report.missionDays} GÜN</span><h1 id="report-title">Görev raporu</h1></div>
        <button className="health-close" onClick={onClose}>Kapat <kbd>Esc</kbd></button>
      </header>
      <section className="report-section report-summary"><h2>Görev Özeti</h2><p>{report.summary}</p></section>
      <div className="report-columns">
        <ReportList title="Attığın Adımlar" items={report.actionsTaken} icon="✓" tone="green" empty="Tamamlanan karşı önlem yok." />
        <ReportList title="Atlanan Önlemler" items={report.missedCountermeasures} icon="⚠" tone="yellow" empty="Atlanan karşı önlem yok." />
      </div>
      <section className="report-section"><h2>Aldığın Riskler</h2>
        {report.risksTaken.length ? <ul className="report-risks">{report.risksTaken.map((risk) => <li key={risk.metricId}>
          <StatusBadge status={risk.status} /><div><strong>{risk.name}</strong><p>{risk.displayValue} · {risk.phase === 'orbit' ? 'Yörünge' : 'Dönüş'}</p>{risk.pending && <small className="draft-label">Taslak içerik</small>}</div>
        </li>)}</ul> : <p>Kaydedilmiş taramalarda risk işareti yok.</p>}
      </section>
      <section className="report-section"><h2>NASA'nın Önerdiği Çözümler</h2>
        {report.nasaCountermeasures.length ? <ul className="solutions-list">{report.nasaCountermeasures.map((solution) => <li key={solution.metricId}>
          <h3>{solution.name}{solution.pending && <span className="draft-label">Taslak içerik</span>}</h3>
          <ul>{solution.advice.map((advice) => <li key={advice}>{advice}</li>)}</ul>
          <small>{solution.evidenceNote}</small>
        </li>)}</ul> : <p>Öneri listesi oluşturmak için tarama bulunamadı.</p>}
      </section>
      <section className="report-section"><h2>Kaynaklar</h2>
        <ul className="source-list">
          {MISSION_REPORT_SOURCES.map((url) => (
            <li key={url}>
              <a href={url} target="_blank" rel="noreferrer">
                {url}
              </a>
            </li>
          ))}
        </ul>
      </section>
      <footer className="report-footer"><SimulationNotice /><button className="print-button" onClick={() => window.print()}>Yazdır <span aria-hidden="true">⎙</span></button></footer>
    </section>
  </div>;
}

function ReportList({ title, items, icon, tone, empty }: { title: string; items: string[]; icon: string; tone: 'green' | 'yellow'; empty: string }) {
  return <section className="report-section"><h2>{title}</h2>{items.length ? <ul className={'action-list tone-' + tone}>{items.map((item) => <li key={item}><span aria-hidden="true">{icon}</span>{item}</li>)}</ul> : <p>{empty}</p>}</section>;
}
