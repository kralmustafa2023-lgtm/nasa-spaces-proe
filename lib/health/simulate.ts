import {
  BONE, CARDIO, COUNTERMEASURES, DAYS_PER_MONTH, IMMUNE, INDEX_MAX, INDEX_MIN,
  METRIC_ORDER, MUSCLE, POST_RECOVERY_DAYS, RADIATION, RECOVERY, SANS,
  SIMULATION_NOTICE, SLEEP_MOOD, STATUS_RANK, VALUE_DECIMALS,
} from './config.ts';
import { METRIC_CONTENT } from './content.ts';
import { ASTRONAUT_PROFILES, type AstronautId } from './astronauts.ts';
import type {
  AvailableScans, HealthScan, MetricComparison, MetricId, MetricResult,
  MissionReport, MitigationTarget, Phase, SimulationContext, Status,
} from './types.ts';

type Values = Record<MetricId, number> & { stress: number };

const round = (value: number) => Number(value.toFixed(VALUE_DECIMALS));
const clampIndex = (value: number) => Math.min(INDEX_MAX, Math.max(INDEX_MIN, value));
const numberTR = (value: number) => round(value).toLocaleString('tr-TR', { maximumFractionDigits: VALUE_DECIMALS });

function validateDays(days: number): void {
  if (!Number.isFinite(days) || days < 0) throw new RangeError('Görev süresi sonlu ve sıfırdan büyük veya eşit olmalıdır.');
}

function worstStatus(statuses: Status[]): Status {
  return statuses.reduce<Status>((worst, status) => STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst, 'green');
}

function increasingStatus(value: number, yellowAt: number, redAt: number): Status {
  return value >= redAt ? 'red' : value >= yellowAt ? 'yellow' : 'green';
}

function decreasingStatus(value: number, greenAt: number, yellowAt: number): Status {
  return value >= greenAt ? 'green' : value >= yellowAt ? 'yellow' : 'red';
}

function statusFor(id: MetricId, value: number): Status {
  switch (id) {
    case 'radiation':
      return increasingStatus(value / RADIATION.careerLimitMSv, RADIATION.greenBelowLimitFraction, RADIATION.redAtLimitFraction);
    case 'bone': return increasingStatus(value, BONE.greenBelowLossPercent, BONE.redAtLossPercent);
    case 'muscle': return increasingStatus(value, MUSCLE.greenBelowLossPercent, MUSCLE.redAtLossPercent);
    case 'sans': return increasingStatus(value, SANS.greenBelowIndex, SANS.redAtIndex);
    case 'cardio': return decreasingStatus(value, CARDIO.greenAtIndex, CARDIO.yellowAtIndex);
    case 'immune': return decreasingStatus(value, IMMUNE.greenAtIndex, IMMUNE.yellowAtIndex);
    case 'sleepMood': return decreasingStatus(value, SLEEP_MOOD.greenAtQualityPercent, SLEEP_MOOD.yellowAtQualityPercent);
  }
}

function stressStatusFor(score: number): Status {
  return increasingStatus(score, SLEEP_MOOD.greenBelowStressScore, SLEEP_MOOD.redAtStressScore);
}

function baselineValues(astronautId?: string): Values {
  const profile = astronautId ? ASTRONAUT_PROFILES[astronautId as AstronautId] : undefined;
  const adj = profile?.baselineAdjustments;

  return {
    radiation: adj ? adj.radiationMSv : RADIATION.baselineMSv,
    bone: BONE.baselineLossPercent,
    muscle: MUSCLE.baselineLossPercent,
    sans: SANS.baselineIndex,
    cardio: adj ? adj.cardioIndex : CARDIO.baselineIndex,
    immune: IMMUNE.baselineIndex,
    sleepMood: adj ? adj.sleepQuality : SLEEP_MOOD.baselineQualityPercent,
    stress: adj ? adj.stressScore : SLEEP_MOOD.baselineStressScore,
  };
}

function remainingFraction(target: MitigationTarget, done: Set<string>): number {
  // Each ID applies once. Independent mitigations multiply the remaining adverse change.
  return COUNTERMEASURES.filter((task) => done.has(task.id))
    .reduce((remaining, task) => remaining * (1 - (task.mitigation[target] ?? 0)), 1);
}

function orbitValues(ctx: SimulationContext): Values {
  const months = ctx.missionDays / DAYS_PER_MONTH;
  const done = new Set(ctx.completedTasks);
  const remaining = (id: MitigationTarget) => remainingFraction(id, done);

  const profile = ctx.astronautId ? ASTRONAUT_PROFILES[ctx.astronautId as AstronautId] : undefined;
  const mult = profile?.multipliers ?? {
    boneLoss: 1.0,
    muscleLoss: 1.0,
    cardioLoss: 1.0,
    stressIncrease: 1.0,
    sleepLoss: 1.0,
    immuneLoss: 1.0,
    recoveryRate: 1.0,
  };

  const base = baselineValues(ctx.astronautId);

  return {
    radiation: base.radiation + ctx.missionDays * RADIATION.dailyDoseMSv * remaining('radiation'),
    bone: clampIndex(base.bone + months * BONE.monthlyLossPercent * remaining('bone') * mult.boneLoss),
    muscle: clampIndex(base.muscle + months * MUSCLE.monthlyLossPercent * remaining('muscle') * mult.muscleLoss),
    sans: clampIndex(base.sans + months * SANS.monthlyIndexIncrease * remaining('sans')),
    cardio: clampIndex(base.cardio - months * CARDIO.monthlyIndexLoss * remaining('cardio') * mult.cardioLoss),
    immune: clampIndex(base.immune - months * IMMUNE.monthlyIndexLoss * remaining('immune') * mult.immuneLoss),
    sleepMood: clampIndex(base.sleepMood - months * SLEEP_MOOD.monthlyQualityLoss * remaining('sleepMood') * mult.sleepLoss),
    stress: clampIndex(base.stress + months * SLEEP_MOOD.monthlyStressIncrease * remaining('stress') * mult.stressIncrease),
  };
}

function postValues(orbit: Values, astronautId?: string): Values {
  const baseline = baselineValues(astronautId);
  const profile = astronautId ? ASTRONAUT_PROFILES[astronautId as AstronautId] : undefined;
  const recoveryFactor = profile?.multipliers.recoveryRate ?? 1.0;

  const result = { ...orbit };
  for (const id of METRIC_ORDER) {
    const rate = Math.min(1.0, (RECOVERY[id] ?? 0.5) * recoveryFactor);
    result[id] = baseline[id] + (orbit[id] - baseline[id]) * (1 - rate);
  }
  const stressRate = Math.min(1.0, RECOVERY.sleepMood * recoveryFactor);
  result.stress = baseline.stress + (orbit.stress - baseline.stress) * (1 - stressRate);
  return result;
}

function buildMetric(id: MetricId, values: Values, astronautId?: string): MetricResult {
  const content = METRIC_CONTENT[id];
  const baseline = baselineValues(astronautId);
  const value = round(values[id]);
  const pending = content.pending ?? false;
  const status = statusFor(id, value);
  const metric: MetricResult = {
    id, name: content.name, unit: id === 'radiation' ? 'mSv' : id === 'bone' || id === 'muscle' ? '% kayıp' : id === 'sleepMood' ? '% kalite' : 'puan',
    value, deltaFromBaseline: round(value - baseline[id]), displayValue: '', status,
    tabletText: '', cabin: structuredClone(content.cabin), pending,
  };
  if (id === 'radiation') {
    metric.careerLimitPercent = round(value / RADIATION.careerLimitMSv * INDEX_MAX);
    metric.displayValue = `${numberTR(value)} mSv`;
    metric.cabin.detail += `. Toplam: ${metric.displayValue}; kariyer limiti: ${numberTR(RADIATION.careerLimitMSv)} mSv; limitin %${numberTR(metric.careerLimitPercent)} kadarı.`;
    metric.tabletText = `Radyasyon: ${metric.displayValue} (${status === 'green' ? 'İyi' : status === 'yellow' ? '⚠️ Dikkat' : '⛔ Yüksek risk'})`;
  } else if (id === 'bone' || id === 'muscle') {
    metric.displayValue = `%${numberTR(value)} Kayıp`;
    metric.tabletText = `${metric.name}: ${metric.displayValue}`;
  } else if (id === 'sleepMood') {
    metric.stressScore = round(values.stress);
    metric.stressStatus = stressStatusFor(metric.stressScore);
    metric.stressLevel = metric.stressStatus === 'green' ? 'Düşük' : metric.stressStatus === 'yellow' ? 'Orta' : 'Yüksek';
    metric.status = worstStatus([status, metric.stressStatus]);
    metric.displayValue = `Uyku %${numberTR(value)} · Stres ${numberTR(metric.stressScore)}/100 (${metric.stressLevel})`;
    metric.tabletText = `Uyku: %${numberTR(value)} · Stres: ${metric.stressLevel}`;
  } else {
    metric.displayValue = `${numberTR(value)}/100`;
    metric.tabletText = `${metric.name}: ${metric.displayValue}`;
  }
  if (pending) metric.tabletText += ' (taslak)';
  return metric;
}

/** Deterministic, independent of store/time/randomness. Post is 30 days after return. */
export function generateScan(phase: Phase, ctx: SimulationContext): HealthScan {
  validateDays(ctx.missionDays);
  if (!['baseline', 'orbit', 'post'].includes(phase)) throw new RangeError('Bilinmeyen tarama aşaması.');
  const values = phase === 'baseline' ? baselineValues(ctx.astronautId)
    : phase === 'orbit' ? orbitValues(ctx) : postValues(orbitValues(ctx), ctx.astronautId);
  const metrics = METRIC_ORDER.map((id) => buildMetric(id, values, ctx.astronautId));
  const overallStatus = worstStatus(metrics.map((metric) => metric.status));
  return {
    phase, missionDay: phase === 'baseline' ? 0 : ctx.missionDays + (phase === 'post' ? POST_RECOVERY_DAYS : 0),
    astronautId: ctx.astronautId,
    metrics, overallStatus, flightSurgeonAlert: overallStatus === 'red',
  };
}

/** Signed changes: b minus a, in each metric's original unit. Stress is separate. */
export function compareScans(a: HealthScan, b: HealthScan): MetricComparison[] {
  return METRIC_ORDER.map((id) => {
    const from = a.metrics.find((metric) => metric.id === id);
    const to = b.metrics.find((metric) => metric.id === id);
    if (!from || !to) throw new Error(`Karşılaştırılacak taramada eksik metrik: ${METRIC_CONTENT[id].name}`);
    return {
      id, name: to.name, unit: to.unit, fromValue: from.value, toValue: to.value,
      change: round(to.value - from.value),
      fromDisplayValue: from.displayValue, toDisplayValue: to.displayValue,
      fromStatus: from.status, toStatus: to.status, pending: Boolean(from.pending || to.pending),
      ...(id === 'sleepMood' ? { stressChange: round((to.stressScore ?? 0) - (from.stressScore ?? 0)) } : {}),
    };
  });
}

/** Reports the worst observed non-baseline status per metric; no fabricated scan if missing. */
export function buildMissionReport(scans: AvailableScans, completedTasks: string[], missionDays: number): MissionReport {
  validateDays(missionDays);
  const done = new Set(completedTasks);
  const actionsTaken = COUNTERMEASURES.filter((task) => done.has(task.id)).map((task) => task.nameTR);
  const missedCountermeasures = COUNTERMEASURES.filter((task) => !done.has(task.id)).map((task) => task.nameTR);
  const risksTaken: MissionReport['risksTaken'] = [];
  const nasaCountermeasures: MissionReport['nasaCountermeasures'] = [];

  for (const id of METRIC_ORDER) {
    let observation: { metric: MetricResult; phase: 'orbit' | 'post' } | undefined;
    for (const phase of ['orbit', 'post'] as const) {
      const metric = scans[phase]?.metrics.find((entry) => entry.id === id);
      if (metric && (!observation || STATUS_RANK[metric.status] > STATUS_RANK[observation.metric.status])) {
        observation = { metric, phase };
      }
    }
    if (!observation || observation.metric.status === 'green') continue;
    const { metric, phase } = observation;
    risksTaken.push({
      metricId: id, name: metric.name, phase, status: metric.status as 'yellow' | 'red',
      displayValue: metric.displayValue, description: `${metric.name}: ${metric.displayValue}; simülasyon göstergesi.`,
      pending: Boolean(metric.pending),
    });
    nasaCountermeasures.push({
      metricId: id, name: metric.name, advice: [...metric.cabin.advice],
      sources: structuredClone(metric.cabin.sources), pending: Boolean(metric.pending),
      evidenceNote: 'NASA risk başlıklarıyla ilişkili simülasyon önerisidir; kaynak bağlantısı olmayan içerik ve etkinlik oranları ayrıca doğrulanmalıdır.',
    });
  }
  const scanSummary = scans.orbit || scans.post
    ? `${risksTaken.length} metrikte dikkat veya yüksek risk göstergesi gözlendi.`
    : 'Görev sırası veya dönüş sonrası tarama bulunmadığından risk değerlendirmesi yapılmadı.';
  return {
    missionDays, actionsTaken, missedCountermeasures, risksTaken, nasaCountermeasures,
    summary: `${numberTR(missionDays)} günlük görevde ${actionsTaken.length} karşı önlem tamamlandı; ${missedCountermeasures.length} karşı önlem eksik. ${scanSummary} ${SIMULATION_NOTICE}`,
  };
}
