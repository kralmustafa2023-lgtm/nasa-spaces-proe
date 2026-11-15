'use client';

import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import { Box3, Group, Vector3 } from 'three';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { assets, type AssetId, type Asset } from '@/data/assets';

const warnedAssets = new Set<AssetId>();

function Placeholder({ label, loading = false }: { label: string; loading?: boolean }) {
  return <group>
    <mesh position={[0, 0.65, 0]}>
      <boxGeometry args={[1.1, 1.3, 1.1]} />
      <meshStandardMaterial color={loading ? '#22d3ee' : '#f04b57'} wireframe />
    </mesh>
    <Html position={[0, 1.65, 0]} center distanceFactor={9}>
      <span className="model-label">{loading ? 'Yükleniyor…' : label}</span>
    </Html>
  </group>;
}

class ModelBoundary extends Component<{ children: ReactNode; label: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <Placeholder label={this.props.label} /> : this.props.children; }
}

function GLB({ asset }: { asset: Asset }) {
  const { scene } = useGLTF(asset.localPath, '/draco/', true, (loader) => {
    loader.setMeshoptDecoder(MeshoptDecoder);
  });
  const model = useMemo(() => {
    const oriented = new Group();
    const clone = cloneSkeleton(scene);
    clone.rotation.set(...asset.rotation);
    oriented.add(clone);
    oriented.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(oriented);
    const size = bounds.getSize(new Vector3());
    const extent = Math.max(size.x, size.y, size.z);
    if (!Number.isFinite(extent) || extent <= 0) throw new Error('Model sınırları geçersiz');
    // NASA models have different units and origins. scale is the target largest extent in metres.
    oriented.scale.setScalar(asset.scale / extent);
    oriented.updateMatrixWorld(true);
    bounds.setFromObject(oriented);
    const center = bounds.getCenter(new Vector3());
    oriented.position.set(-center.x, -bounds.min.y, -center.z);
    return oriented;
  }, [scene, asset]);
  return <primitive object={model} />;
}

export default function ModelLoader({ id, position }: { id: AssetId; position?: [number, number, number] }) {
  const asset = assets.find((entry) => entry.id === id);
  if (!asset) return <Placeholder label={id} />;
  if (asset.status !== 'ok') {
    if (!warnedAssets.has(id)) {
      warnedAssets.add(id);
      console.warn(`[NASA models] ${id} durumu ${asset.status}; model yüklemesi atlandı.`);
    }
    return <group position={position ?? asset.position}><Placeholder label={asset.label} /></group>;
  }
  return <group position={position ?? asset.position}>
    <ModelBoundary key={asset.localPath} label={asset.label}>
      <Suspense fallback={<Placeholder label={asset.label} loading />}>
        <GLB asset={asset} />
      </Suspense>
    </ModelBoundary>
  </group>;
}
