import { describe, expect, it } from 'vitest';
import {
  BONE, COUNTERMEASURES, IMMUNE, MISSION_DAYS_DEFAULT, POST_RECOVERY_DAYS,
  RADIATION, SIMULATION_NOTICE, SLEEP_MOOD,
} from './config.ts';
import { METRIC_CONTENT, RADIATION_SOURCE, unverifiedClaims } from './content.ts';
import { buildMissionReport, compareScans, generateScan } from './simulate.ts';
import type { HealthScan, MetricId, SimulationContext } from './types.ts';

const none: SimulationContext = { missionDays: MISSION_DAYS_DEFAULT, completedTasks: [] };
const all = { ...none, completedTasks: COUNTERMEASURES.map((task) => task.id) };
const partial = { ...none, completedTasks: ['resistanceExercise', 'sleepRoutine'] };
const metric = (scan: HealthScan, id: MetricId) => scan.metrics.find((entry) => entry.id === id)!;

describe('Sağlık simülasyonu kabul senaryoları', () => {
  it('başlangıçta yedi metrik de yeşildir ve uyarı yoktur', () => {
    const scan = generateScan('baseline', all);
    expect(scan.metrics).toHaveLength(7);
    expect(scan.metrics.every((entry) => entry.status === 'green')).toBe(true);
    expect(scan.metrics.every((entry) => entry.deltaFromBaseline === 0)).toBe(true);
    expect(scan.overallStatus).toBe('green');
    expect(scan.flightSurgeonAlert).toBe(false);
    expect(scan.missionDay).toBe(0);
  });

  it('görevsiz 180 günde en az üç kırmızı/sarı metrik ve en az %6 kemik kaybı oluşur', () => {
    const scan = generateScan('orbit', none);
    expect(scan.metrics.filter((entry) => entry.status !== 'green').length).toBeGreaterThanOrEqual(3);
    expect(scan.metrics.filter((entry) => entry.status === 'red').length).toBeGreaterThanOrEqual(3);
    expect(metric(scan, 'bone').value).toBeGreaterThanOrEqual(6);
    expect(scan.overallStatus).toBe('red');
    expect(scan.flightSurgeonAlert).toBe(true);
  });

  it('tüm karşı önlemler kırmızı sayısını sıfırlar ve kemik kaybını azaltır', () => {
    const untreated = generateScan('orbit', none);
    const protectedScan = generateScan('orbit', all);
    expect(protectedScan.metrics.filter((entry) => entry.status === 'red')).toHaveLength(0);
    expect(metric(protectedScan, 'bone').value).toBeLessThan(metric(untreated, 'bone').value);
    expect(protectedScan.overallStatus).toBe('yellow');
    expect(protectedScan.flightSurgeonAlert).toBe(false);
  });

  it('kısmi görevde kemik sarı, uyku yeşil veya sarıdır', () => {
    const scan = generateScan('orbit', partial);
    expect(metric(scan, 'bone').status).toBe('yellow');
    expect(metric(scan, 'bone').value).toBeCloseTo(3.6);
    expect(['green', 'yellow']).toContain(metric(scan, 'sleepMood').status);
    expect(metric(scan, 'sleepMood').stressLevel).toBe('Orta');
  });

  it('radyasyon 180 × 0,5 = 90 mSv, kariyer limitinin %15’i ve sarıdır', () => {
    const radiation = metric(generateScan('orbit', none), 'radiation');
    expect(RADIATION.dailyDoseMSv).toBe(0.5);
    expect(radiation.value).toBe(90);
    expect(radiation.careerLimitPercent).toBe(15);
    expect(radiation.status).toBe('yellow');
    expect(radiation.cabin.detail).toContain('90 mSv');
    expect(radiation.cabin.detail).toContain('600 mSv');
  });

  it('dönüşte doz korunur, kemik kısmen ve bağışıklık/uyku belirgin toparlanır', () => {
    const baseline = generateScan('baseline', none);
    const orbit = generateScan('orbit', none);
    const post = generateScan('post', none);
    expect(metric(post, 'radiation').value).toBe(metric(orbit, 'radiation').value);
    expect(metric(post, 'bone').value).toBeLessThan(metric(orbit, 'bone').value);
    expect(metric(post, 'bone').value).toBeGreaterThan(metric(baseline, 'bone').value);
    expect(metric(post, 'bone').value).toBeCloseTo(6.75);
    expect(metric(post, 'immune').value).toBeCloseTo(92.8);
    expect(metric(post, 'sleepMood').value).toBeCloseTo(87);
    expect(metric(post, 'sleepMood').stressScore).toBeCloseTo(19.2);
    expect(metric(post, 'immune').status).toBe('green');
    expect(metric(post, 'sleepMood').status).toBe('green');
    expect(post.missionDay).toBe(MISSION_DAYS_DEFAULT + POST_RECOVERY_DAYS);
  });

  it('görevsiz rapor eksik karşı önlemler ve en az üç riski içerir', () => {
    const orbit = generateScan('orbit', none);
    const report = buildMissionReport({ orbit }, [], MISSION_DAYS_DEFAULT);
    expect(report.actionsTaken).toEqual([]);
    expect(report.missedCountermeasures).toHaveLength(COUNTERMEASURES.length);
    expect(report.risksTaken.length).toBeGreaterThanOrEqual(3);
    expect(report.nasaCountermeasures).toHaveLength(report.risksTaken.length);
    expect(report.nasaCountermeasures.every((item) => item.advice.length > 0)).toBe(true);
    expect(report.summary).toContain(SIMULATION_NOTICE);
  });
});

describe('Sınırlar, saflık ve rapor güvenilirliği', () => {
  it.each([[120, 'yellow'], [300, 'red']] as const)('radyasyon %10 ve %25 sınırlarını dahil eder: %s gün', (missionDays, status) => {
    expect(metric(generateScan('orbit', { missionDays, completedTasks: [] }), 'radiation').status).toBe(status);
  });

  it.each([[40, 'yellow'], [120, 'red']] as const)('kemik %2 ve %6 sınırlarını dahil eder: %s gün', (missionDays, status) => {
    expect(metric(generateScan('orbit', { missionDays, completedTasks: [] }), 'bone').status).toBe(status);
  });

  it.each([[50, 'green'], [125, 'yellow'], [126, 'red']] as const)('bağışıklık 90 ve 75 eşiklerini uygular: %s gün', (missionDays, status) => {
    expect(metric(generateScan('orbit', { missionDays, completedTasks: [] }), 'immune').status).toBe(status);
  });

  it('daha uzun görev olumsuz değişimi artırır ve endeksleri 0–100 içinde tutar', () => {
    const short = generateScan('orbit', { ...none, missionDays: 90 });
    const longer = generateScan('orbit', none);
    expect(metric(longer, 'radiation').value).toBeGreaterThan(metric(short, 'radiation').value);
    expect(metric(longer, 'bone').value).toBeGreaterThan(metric(short, 'bone').value);
    const longScan = generateScan('orbit', { ...none, missionDays: 10000 });
    for (const item of longScan.metrics.filter((entry) => entry.id !== 'radiation')) {
      expect(item.value).toBeGreaterThanOrEqual(0);
      expect(item.value).toBeLessThanOrEqual(100);
    }
  });

  it('tekrarlanan ve bilinmeyen görevler ek azaltım yaratmaz; girdileri değiştirmez', () => {
    const ctx = { ...none, completedTasks: ['resistanceExercise', 'resistanceExercise', 'unknown'] };
    const before = structuredClone(ctx);
    expect(generateScan('orbit', ctx)).toEqual(generateScan('orbit', { ...none, completedTasks: ['resistanceExercise'] }));
    expect(ctx).toEqual(before);
    const scan = generateScan('baseline', none);
    scan.metrics[0].cabin.advice.push('Test değişikliği');
    expect(METRIC_CONTENT.radiation.cabin.advice).not.toContain('Test değişikliği');
  });

  it('kas için birleşik azaltımları çarpar; başlangıç sağlığını azaltmaz', () => {
    const scan = generateScan('orbit', all);
    expect(metric(scan, 'muscle').value).toBeCloseTo(2.98);
    expect(metric(scan, 'immune').value).toBeCloseTo(87.4);
    expect(metric(generateScan('baseline', all), 'immune').value).toBe(IMMUNE.baselineIndex);
  });

  it('stres uyku/ruh hali durumunu etkiler ve iletişim bunu düşürür', () => {
    const noCommunication = generateScan('orbit', { ...none, completedTasks: ['sleepRoutine'] });
    const withCommunication = generateScan('orbit', { ...none, completedTasks: ['sleepRoutine', 'crewCommunication'] });
    expect(metric(noCommunication, 'sleepMood').status).toBe('yellow');
    expect(metric(withCommunication, 'sleepMood').status).toBe('green');
    expect(metric(noCommunication, 'sleepMood').value).toBe(metric(withCommunication, 'sleepMood').value);
  });

  it('karşılaştırma imzalı farkı, birimi ve stres farkını verir', () => {
    const baseline = generateScan('baseline', none);
    const orbit = generateScan('orbit', none);
    const comparison = compareScans(baseline, orbit);
    expect(comparison).toHaveLength(7);
    expect(comparison.find((item) => item.id === 'bone')?.change).toBe(9);
    expect(comparison.find((item) => item.id === 'immune')?.change).toBe(-36);
    expect(comparison.find((item) => item.id === 'sleepMood')?.stressChange).toBe(42);
    expect(compareScans(orbit, baseline).find((item) => item.id === 'bone')?.change).toBe(-9);
    expect(() => compareScans({ ...baseline, metrics: [] }, orbit)).toThrow('eksik metrik');
  });

  it('raporda her metrik için en kötü gözlemi kullanır ve eksik tarama üretmez', () => {
    const orbit = generateScan('orbit', none);
    const post = generateScan('post', none);
    const report = buildMissionReport({ orbit, post }, ['resistanceExercise', 'resistanceExercise'], 180);
    expect(report.actionsTaken).toEqual(['Direnç egzersizi']);
    expect(new Set(report.risksTaken.map((item) => item.metricId)).size).toBe(report.risksTaken.length);
    expect(report.risksTaken.find((item) => item.metricId === 'immune')?.phase).toBe('orbit');
    expect(buildMissionReport({ post }, [], 180).risksTaken.length).toBeGreaterThan(0);
    expect(buildMissionReport({}, [], 180).summary).toContain('tarama bulunmadığından');
    expect(buildMissionReport({}, [], 180).risksTaken).toEqual([]);
  });

  it('yalnızca sağlanan kaynak URL’sini dışa verir ve doğrulanmamış iddiaları dışarı sızdırmaz', () => {
    const scans = { baseline: generateScan('baseline', none), orbit: generateScan('orbit', none), post: generateScan('post', none) };
    const output = JSON.stringify({ scans, report: buildMissionReport(scans, [], 180) });
    expect(unverifiedClaims.every((claim) => claim.showInUI === false && claim.verified === false)).toBe(true);
    for (const claim of unverifiedClaims) expect(output).not.toContain(claim.text);
    const urls = Object.values(METRIC_CONTENT).flatMap((content) => content.cabin.sources.map((source) => source.url)).filter(Boolean);
    expect(urls).toEqual([RADIATION_SOURCE.url]);
    for (const id of ['muscle', 'sans', 'cardio'] as const) {
      const item = metric(scans.orbit, id);
      expect(item.pending).toBe(true);
      expect(item.cabin.nasaRiskName).toBe('TODO(pdf)');
      expect(item.cabin.sources[0].url).toBeNull();
    }
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])('geçersiz süreyi reddeder: %s', (missionDays) => {
    expect(() => generateScan('orbit', { missionDays, completedTasks: [] })).toThrow(RangeError);
  });

  it('sıfır günlük uçuş tüm metrikleri başlangıçta tutar', () => {
    const scan = generateScan('orbit', { ...none, missionDays: 0 });
    expect(scan.overallStatus).toBe('green');
    expect(scan.metrics.every((item) => item.deltaFromBaseline === 0)).toBe(true);
    expect(BONE.monthlyLossPercent).toBe(1.5);
    expect(SLEEP_MOOD.baselineQualityPercent).toBe(90);
  });
});
