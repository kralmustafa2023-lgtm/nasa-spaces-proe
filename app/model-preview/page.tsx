'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import metaFile from '@/public/models/model-meta.json';
import { assets, type AssetId, type AssetStatus } from '@/data/assets';
import './model-preview.css';

const ModelPreviewCanvas = dynamic(() => import('./ModelPreviewCanvas'), {
  ssr: false,
  loading: () => <div className="preview-canvas-placeholder">Önizleme yükleniyor…</div>,
});

type ModelMeta = (typeof metaFile.models)[keyof typeof metaFile.models];
type Meta = Record<AssetId, ModelMeta>;
const statuses: Record<AssetStatus, { label: string; icon: string }> = {
  ok: { label: 'Hazır', icon: '✓' },
  'needs-manual': { label: 'Elle hazırlanmalı', icon: '⚠' },
  fallback: { label: 'Yedek', icon: '↩' },
  missing: { label: 'Eksik', icon: '✖' },
};

export default function ModelPreviewPage() {
  const [selectedId, setSelectedId] = useState<AssetId>(assets[0].id);
  const [wireframe, setWireframe] = useState(false);
  const [showBounds, setShowBounds] = useState(false);
  const [showHumanScale, setShowHumanScale] = useState(false);
  const meta = (metaFile.models as Meta)[selectedId];
  const asset = useMemo(() => assets.find((item) => item.id === selectedId)!, [selectedId]);
  const status = statuses[asset.status];
  const boxSize = meta.boundingBoxMeters?.size;

  return <main className="model-preview-page">
    <header className="model-preview-header">
      <div><span className="preview-eyebrow">MISSION 180 / VARLIK LABORATUVARI</span><h1>Model önizleme</h1></div>
      <label>NASA modeli<select value={selectedId} onChange={(event) => setSelectedId(event.target.value as AssetId)}>
        {assets.map((entry) => <option key={entry.id} value={entry.id}>{entry.label} · {statuses[entry.status].label}</option>)}
      </select></label>
    </header>
    <section className="preview-workspace">
      <div className="preview-viewer">
        <div className="preview-toolbar">
          <button aria-pressed={wireframe} onClick={() => setWireframe((value) => !value)}><span>{wireframe ? '▧' : '▤'}</span>Tel kafes</button>
          <button aria-pressed={showBounds} onClick={() => setShowBounds((value) => !value)}><span>□</span>Sınır kutusu</button>
          <button aria-pressed={showHumanScale} onClick={() => setShowHumanScale((value) => !value)}><span>↕</span>İnsan boyutu / 1,8 m</button>
        </div>
        <ModelPreviewCanvas id={selectedId} wireframe={wireframe} showBounds={showBounds} showHumanScale={showHumanScale} />
        <div className="preview-viewer-footer">Fare ile döndür · Tekerlekle yakınlaştır · Sağ tuşla kaydır</div>
      </div>
      <aside className="preview-info">
        <div className="preview-info-heading"><div><span className="preview-eyebrow">{asset.id}</span><h2>{asset.label}</h2></div><span className={'asset-status status-' + asset.status}><i>{status.icon}</i>{status.label}</span></div>
        <dl className="preview-stats">
          <div><dt>Dosya boyutu</dt><dd>{meta.sizeMB.toFixed(2)} MiB</dd></div>
          <div><dt>Üçgen sayısı</dt><dd>{meta.triangleCount.toLocaleString('tr-TR')}</dd></div>
          <div><dt>Doku sayısı</dt><dd>{meta.textureCount}</dd></div>
          <div><dt>Önerilen en uzun kenar</dt><dd>{meta.recommendedScale} m</dd></div>
          <div><dt>Animasyon</dt><dd>{meta.hasAnimations ? 'Var (' + meta.animationCount + ')' : 'Yok'}</dd></div>
        </dl>
        <section className="preview-meta-section"><h3>Sınır kutusu / metre</h3>
          {boxSize ? <p>X {boxSize[0].toFixed(2)} · Y {boxSize[1].toFixed(2)} · Z {boxSize[2].toFixed(2)}</p> : <p>Model ölçüsü bulunamadı.</p>}
        </section>
        <section className="preview-meta-section"><h3>Düğüm adları</h3>
          {meta.nodeNames.length ? <ul className="node-list">{meta.nodeNames.slice(0, 40).map((name, index) => <li key={name + index}>{name}</li>)}</ul> : <p>Düğüm bilgisi bulunamadı.</p>}
        </section>
        {meta.warnings.length > 0 && <section className="preview-warning"><h3>Not</h3>{meta.warnings.map((warning) => <p key={warning}>{warning}</p>)}</section>}
        <p className="preview-simulation-note">Varlık ölçüleri model geometrisinden hesaplanmıştır; önerilen boyutlar yaklaşık sahne yerleşimi içindir.</p>
      </aside>
    </section>
  </main>;
}
