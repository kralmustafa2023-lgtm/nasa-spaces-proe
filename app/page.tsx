'use client';

import { useState, useEffect } from 'react';
import MissionExperience from '@/components/MissionExperience';
import AstronautSelect from '@/components/AstronautSelect';
import { useGameStore } from '@/store/gameStore';

export default function Page() {
  const [mounted, setMounted] = useState(false);
  const astronautId = useGameStore((state) => state.astronautId);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main
        style={{
          width: '100vw',
          height: '100vh',
          backgroundColor: '#030a14',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          gap: '16px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            border: '2px solid rgba(56, 189, 248, 0.2)',
            borderTopColor: '#38bdf8',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', letterSpacing: '2px' }}>
          <span style={{ color: '#38bdf8', fontWeight: 700 }}>NASA MISSION 180</span>
          <span style={{ color: '#64748b' }}>//</span>
          <span style={{ color: '#94a3b8' }}>GÖREV ORTAMI BAŞLATILIYOR…</span>
        </div>
      </main>
    );
  }

  if (!astronautId) {
    return <AstronautSelect />;
  }

  return <MissionExperience />;
}
