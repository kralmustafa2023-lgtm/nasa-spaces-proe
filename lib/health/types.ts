export type Phase = 'baseline' | 'orbit' | 'post';
export type Status = 'green' | 'yellow' | 'red';
export type MetricId = 'radiation' | 'bone' | 'muscle' | 'sans' | 'cardio' | 'immune' | 'sleepMood';

export interface SourceReference {
  label: string;
  // null explicitly marks a missing source; never substitute a guessed URL.
  url: string | null;
}

export interface MetricCabinInfo {
  title: string;
  detail: string;
  nasaRiskName: string;
  hazards: string[];
  conditions: string[];
  advice: string[];
  sources: SourceReference[];
}

export interface MetricResult {
  id: MetricId;
  name: string;
  unit: string;
  value: number;
  /** Signed value minus baseline; negative is better for loss/dose and worse for indices. */
  deltaFromBaseline: number;
  displayValue: string;
  status: Status;
  tabletText: string;
  cabin: MetricCabinInfo;
  pending?: boolean;
  /** sleepMood.value is sleep quality. Stress has its own scale and status. */
  stressScore?: number;
  stressLevel?: 'Düşük' | 'Orta' | 'Yüksek';
  stressStatus?: Status;
  /** Present on radiation; percentage of the configured career limit. */
  careerLimitPercent?: number;
}

export interface HealthScan {
  phase: Phase;
  missionDay: number;
  astronautId?: string;
  metrics: MetricResult[];
  overallStatus: Status;
  flightSurgeonAlert: boolean;
}

export interface SimulationContext {
  missionDays: number;
  completedTasks: string[];
  astronautId?: string;
}

export type ScanSet = Record<Phase, HealthScan | null>;
export type AvailableScans = Partial<ScanSet>;

export interface MetricComparison {
  id: MetricId;
  name: string;
  unit: string;
  fromValue: number;
  toValue: number;
  change: number;
  fromDisplayValue: string;
  toDisplayValue: string;
  fromStatus: Status;
  toStatus: Status;
  pending: boolean;
  stressChange?: number;
}

export interface MissionRisk {
  metricId: MetricId;
  name: string;
  phase: Phase;
  status: Exclude<Status, 'green'>;
  displayValue: string;
  description: string;
  pending: boolean;
}

export interface ReportCountermeasure {
  metricId: MetricId;
  name: string;
  advice: string[];
  sources: SourceReference[];
  pending: boolean;
  /** A NASA risk label is not evidence that a numerical mitigation is clinically validated. */
  evidenceNote: string;
}

export interface MissionReport {
  missionDays: number;
  actionsTaken: string[];
  missedCountermeasures: string[];
  risksTaken: MissionRisk[];
  nasaCountermeasures: ReportCountermeasure[];
  summary: string;
}

export type MitigationTarget = MetricId | 'stress';
export interface Countermeasure {
  id: string;
  nameTR: string;
  descriptionTR: string;
  /** Fraction of the adverse change prevented, not a subtraction from the healthy baseline. */
  mitigation: Partial<Record<MitigationTarget, number>>;
}
