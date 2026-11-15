'use client';

import { Component, Suspense, useMemo, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { Bounds, Grid, Html, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, Box3Helper, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { clone as cloneSkeleton } from 'three/addons/utils/SkeletonUtils.js';
import { assets, type AssetId } from '@/data/assets';

function ErrorFallback({ label }: { label: string }) {
  return <group>
    <mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ef4444" wireframe /></mesh>
    <Html position={[0, 0.8, 0]} center><span className="preview-load-error">{label} yüklenemedi</span></Html>
  </group>;
}

class ModelErrorBoundary extends Component<{ children: ReactNode; label: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ErrorFallback label={this.props.label} /> : this.props.children; }
}

function LoadedModel({ id, wireframe, showBounds }: { id: AssetId; wireframe: boolean; showBounds: boolean }) {
  const asset = assets.find((item) => item.id === id)!;
  const { scene } = useGLTF(asset.localPath, false, false, (gltfLoader) => {
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
  });
  const model = useMemo(() => {
    const clone = cloneSkeleton(scene);
    clone.rotation.set(...asset.rotation);
    const group = new Group(); group.add(clone); group.updateMatrixWorld(true);
    const bounds = new Box3().setFromObject(group);
    const size = bounds.getSize(new Vector3());
    const extent = Math.max(size.x, size.y, size.z) || 1;
    group.scale.setScalar(asset.scale / extent);
    group.updateMatrixWorld(true);
    bounds.setFromObject(group);
    const center = bounds.getCenter(new Vector3());
    group.position.set(-center.x, -bounds.min.y, -center.z);
    return group;
  }, [scene, asset]);
  const display = useMemo(() => {
    const clone = cloneSkeleton(model);
    clone.traverse((object) => {
      if (!('material' in object) || !object.material) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) if ('wireframe' in material) material.wireframe = wireframe;
    });
    return clone;
  }, [model, wireframe]);
  const bounds = useMemo(() => new Box3().setFromObject(model), [model]);
  return <group><primitive object={display} />{showBounds && <primitive object={new Box3Helper(bounds, '#facc15')} />}</group>;
}

function HumanScale() {
  return <group position={[2, 0, 0]}>
    <mesh position={[0, 0.9, 0]}><capsuleGeometry args={[0.19, 1.42, 4, 8]} /><meshStandardMaterial color="#22c55e" transparent opacity={0.72} /></mesh>
    <mesh position={[0, 1.68, 0]}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color="#22c55e" /></mesh>
    <mesh position={[0.32, 0.9, 0]}><boxGeometry args={[0.018, 1.8, 0.018]} /><meshBasicMaterial color="#86efac" /></mesh>
  </group>;
}

export default function ModelPreviewCanvas({ id, wireframe, showBounds, showHumanScale }: { id: AssetId; wireframe: boolean; showBounds: boolean; showHumanScale: boolean }) {
  const selected = assets.find((asset) => asset.id === id)!;
  if (selected.status !== 'ok') return <div className="preview-canvas-placeholder"><div><span>MODEL DURUMU / {selected.status.toUpperCase()}</span><p>{selected.status === 'missing' ? 'Bu model için dosya bulunamadı.' : 'Bu model şu anda hazır değil.'}</p><div className="preview-red-box" /></div></div>;
  return <div className="preview-canvas">
    <Canvas camera={{ position: [5, 4, 7], fov: 45, near: 0.01, far: 2000 }} dpr={[1, 1.5]} fallback={<div>WebGL kullanılamıyor.</div>}>
      <color attach="background" args={['#d7e0e4']} />
      <ambientLight intensity={1.6} />
      <hemisphereLight args={['#f2f7fa', '#77828a', 1.4]} />
      <directionalLight position={[5, 8, 6]} intensity={3} />
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2000, 2000]} /><meshStandardMaterial color="#d7e0e4" /></mesh>
      <Grid args={[30, 30]} position={[0, -0.015, 0]} cellSize={1} sectionSize={5} cellColor="#88969d" sectionColor="#60727d" fadeDistance={70} infiniteGrid />
      <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#ef4444" wireframe /></mesh>}>
        <ModelErrorBoundary label={selected.label}><Bounds fit clip observe margin={1.2}><LoadedModel id={id} wireframe={wireframe} showBounds={showBounds} /></Bounds></ModelErrorBoundary>
      </Suspense>
      {showHumanScale && <HumanScale />}
      <OrbitControls makeDefault enableDamping minDistance={0.3} maxDistance={1000} />
    </Canvas>
  </div>;
}
