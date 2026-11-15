import { beforeEach, describe, expect, it } from 'vitest';
import { generateScan } from '../lib/health/simulate.ts';
import { MISSION_DAYS_DEFAULT } from '../lib/health/config.ts';
import { useGameStore } from './gameStore';

beforeEach(() => {
  useGameStore.setState({
    scene: 'intro', wristOpen: false, missionDays: MISSION_DAYS_DEFAULT,
    completedTasks: [], scans: { baseline: null, orbit: null, post: null }, reportOpen: false,
    activeOverlay: null, astronautId: null,
  });
});

describe('Sağlık store bağlantısı', () => {
  it('aynı görevi iki kez eklemez', () => {
    useGameStore.getState().addTask('resistanceExercise');
    useGameStore.getState().addTask('resistanceExercise');
    expect(useGameStore.getState().completedTasks).toEqual(['resistanceExercise']);
  });

  it('overlay durumunu ve rapor bayrağını birlikte günceller', () => {
    useGameStore.getState().setOverlay('report');
    expect(useGameStore.getState().activeOverlay).toBe('report');
    expect(useGameStore.getState().reportOpen).toBe(true);
    useGameStore.getState().setOverlay(null);
    expect(useGameStore.getState().activeOverlay).toBeNull();
    expect(useGameStore.getState().reportOpen).toBe(false);
  });

  it('runScan güncel süre ve görevleri kullanır, diğer taramaları ve mevcut alanları korur', () => {
    useGameStore.getState().runScan('baseline');
    const baseline = useGameStore.getState().scans.baseline;
    useGameStore.setState({ missionDays: 90, scene: 'station', wristOpen: true });
    useGameStore.getState().addTask('sleepRoutine');
    useGameStore.getState().runScan('orbit');
    const state = useGameStore.getState();
    expect(state.scans.orbit).toEqual(generateScan('orbit', { missionDays: 90, completedTasks: ['sleepRoutine'] }));
    expect(state.scans.baseline).toBe(baseline);
    expect(state.scans.post).toBeNull();
    expect(state.scene).toBe('station');
    expect(state.wristOpen).toBe(true);
    state.runScan('post');
    expect(useGameStore.getState().scans.post?.missionDay).toBe(120);
  });

  it('astronot profili seçimini saklar ve taramaya yansıtır', () => {
    expect(useGameStore.getState().astronautId).toBeNull();
    useGameStore.getState().setAstronaut('rookie');
    expect(useGameStore.getState().astronautId).toBe('rookie');

    useGameStore.getState().runScan('baseline');
    expect(useGameStore.getState().scans.baseline?.astronautId).toBe('rookie');

    useGameStore.getState().setAstronaut('senior');
    useGameStore.getState().runScan('orbit');
    expect(useGameStore.getState().scans.orbit?.astronautId).toBe('senior');
  });
});
