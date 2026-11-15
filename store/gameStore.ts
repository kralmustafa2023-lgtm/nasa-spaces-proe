import { create } from 'zustand';
import { MISSION_DAYS_DEFAULT } from '../lib/health/config.ts';
import { generateScan } from '../lib/health/simulate.ts';
import type { AstronautId } from '../lib/health/astronauts.ts';
import type { Phase, ScanSet } from '../lib/health/types.ts';

export type ActiveOverlay = null | 'cabin' | 'comparison' | 'report' | 'survey';

export const SCENES = [
  'intro', 'launchCenterScan1', 'shuttleCockpit', 'orbit',
  'station', 'landing', 'launchCenterScan2',
] as const;
export type Scene = typeof SCENES[number];

export const SCENE_LABELS: Record<Scene, string> = {
  intro: 'NASA Yerleşkesi',
  launchCenterScan1: 'Görev Kontrol Merkezi · İlk Tarama',
  shuttleCockpit: 'Mekik Kokpiti',
  orbit: 'Dünya Yörüngesi',
  station: 'Uzay İstasyonu',
  landing: 'Dünya’ya Dönüş',
  launchCenterScan2: 'Görev Kontrol Merkezi · Son Tarama',
};

/** İstasyonda onarılması gereken bozuk sistemler. */
export const REPAIRS = [
  { id: 'power', label: 'Güç modülü' },
  { id: 'oxygen', label: 'Oksijen sistemi' },
  { id: 'comms', label: 'İletişim anteni' },
] as const;

export const SCAN_MS = 3200;

interface GameState {
  scene: Scene;
  setScene: (scene: Scene) => void;
  nextScene: () => void;
  wristOpen: boolean;
  toggleWrist: () => void;
  missionDays: number;
  completedTasks: string[];
  addTask: (id: string) => void;
  repairs: string[];
  addRepair: (id: string) => void;
  activeRepair: string | null;
  openRepair: (id: string) => void;
  closeRepair: () => void;
  hologramOpen: boolean;
  toggleHologram: () => void;
  scans: ScanSet;
  runScan: (phase: Phase) => void;
  /** Kabin ekranında hangi taramanın gösterildiği. */
  cabinPhase: Phase;
  /** Kabin animasyonu sürerken taranan aşama. */
  scanning: Phase | null;
  startScan: (phase: Phase) => void;
  survey: number[] | null;
  setSurvey: (answers: number[]) => void;
  countdown: number | null;
  cockpitMode: 'launch' | 'descent';
  setCockpitMode: (mode: 'launch' | 'descent') => void;
  startLaunch: () => void;
  startDescent: () => void;
  prompt: string | null;
  setPrompt: (prompt: string | null) => void;
  toast: string | null;
  notify: (message: string) => void;
  reportOpen: boolean;
  activeOverlay: ActiveOverlay;
  setOverlay: (overlay: ActiveOverlay) => void;
  /** Seçilen astronot profil kimliği. null = seçim ekranı gösterilir. */
  astronautId: AstronautId | null;
  setAstronaut: (id: AstronautId) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  scene: 'intro',
  setScene: (scene) => set({ scene, prompt: null }),
  nextScene: () => set((state) => ({
    scene: SCENES[Math.min(SCENES.indexOf(state.scene) + 1, SCENES.length - 1)],
    prompt: null,
  })),
  wristOpen: false,
  toggleWrist: () => set((state) => ({
    wristOpen: !state.wristOpen,
    activeOverlay: state.wristOpen ? state.activeOverlay : null,
  })),
  missionDays: MISSION_DAYS_DEFAULT,
  completedTasks: [],
  addTask: (id) => set((state) => ({
    completedTasks: state.completedTasks.includes(id)
      ? state.completedTasks : [...state.completedTasks, id],
  })),
  repairs: [],
  addRepair: (id) => set((state) => ({
    repairs: state.repairs.includes(id) ? state.repairs : [...state.repairs, id],
  })),
  activeRepair: null,
  openRepair: (id) => set({ activeRepair: id, prompt: null }),
  closeRepair: () => set({ activeRepair: null }),
  hologramOpen: false,
  toggleHologram: () => set((state) => ({ hologramOpen: !state.hologramOpen })),
  scans: { baseline: null, orbit: null, post: null },
  runScan: (phase) => set((state) => ({
    scans: { ...state.scans, [phase]: generateScan(phase, {
      missionDays: state.missionDays,
      completedTasks: state.completedTasks,
      astronautId: state.astronautId ?? undefined,
    }) },
  })),
  cabinPhase: 'baseline',
  scanning: null,
  startScan: (phase) => {
    if (get().scanning) return;
    set({ scanning: phase, prompt: null });
    setTimeout(() => {
      get().runScan(phase);
      set({ scanning: null, cabinPhase: phase });
      get().setOverlay(phase === 'orbit' ? 'survey' : 'cabin');
    }, SCAN_MS);
  },
  survey: null,
  setSurvey: (survey) => set({ survey }),
  countdown: null,
  cockpitMode: 'launch',
  setCockpitMode: (cockpitMode) => set({ cockpitMode }),
  startLaunch: () => {
    if (get().countdown !== null) return;
    set({ countdown: 3, prompt: null, cockpitMode: 'launch' });
    const timer = setInterval(() => {
      const next = (get().countdown ?? 0) - 1;
      if (next <= 0) {
        clearInterval(timer);
        set({ countdown: null });
        get().setScene('orbit');
      } else set({ countdown: next });
    }, 1000);
  },
  startDescent: () => {
    if (get().countdown !== null) return;
    set({ countdown: 4, prompt: null, cockpitMode: 'descent' });
    const timer = setInterval(() => {
      const next = (get().countdown ?? 0) - 1;
      if (next <= 0) {
        clearInterval(timer);
        set({ countdown: null });
        get().setScene('landing');
        get().notify('Mekik başarıyla Kennedy Uzay Merkezi pistine teker koydu! Merkez Binaya dönün.');
      } else set({ countdown: next });
    }, 1000);
  },
  prompt: null,
  setPrompt: (prompt) => set({ prompt }),
  toast: null,
  notify: (message) => {
    set({ toast: message });
    setTimeout(() => { if (get().toast === message) set({ toast: null }); }, 3500);
  },
  reportOpen: false,
  activeOverlay: null,
  setOverlay: (activeOverlay) => set((state) => ({
    activeOverlay, reportOpen: activeOverlay === 'report',
    wristOpen: activeOverlay ? false : state.wristOpen,
  })),
  astronautId: null,
  setAstronaut: (id) => set({ astronautId: id }),
}));
