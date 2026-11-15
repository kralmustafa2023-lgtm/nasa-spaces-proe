import { COUNTERMEASURES, MISSION_DAYS_DEFAULT, STATUS_LABELS } from '../lib/health/config.ts';
import { generateScan } from '../lib/health/simulate.ts';
import type { Phase, SimulationContext } from '../lib/health/types.ts';

const scenarios: Array<{ name: string; context: SimulationContext }> = [
  { name: 'Görevsiz', context: { missionDays: MISSION_DAYS_DEFAULT, completedTasks: [] } },
  { name: 'Kısmi görev', context: { missionDays: MISSION_DAYS_DEFAULT, completedTasks: ['resistanceExercise', 'sleepRoutine'] } },
  { name: 'Tam görev', context: { missionDays: MISSION_DAYS_DEFAULT, completedTasks: COUNTERMEASURES.map((task) => task.id) } },
];

for (const scenario of scenarios) {
  console.log(`\n=== ${scenario.name} / ${scenario.context.missionDays} gün ===`);
  for (const phase of ['baseline', 'orbit', 'post'] as Phase[]) {
    const scan = generateScan(phase, scenario.context);
    console.log(`\n${phase.toUpperCase()} · genel: ${STATUS_LABELS[scan.overallStatus]} · uçuş cerrahı uyarısı: ${scan.flightSurgeonAlert ? 'EVET' : 'hayır'}`);
    console.table(scan.metrics.map((metric) => ({
      metrik: metric.name, değer: metric.displayValue, durum: STATUS_LABELS[metric.status],
      stres: metric.stressScore === undefined ? '—' : `${metric.stressScore} (${metric.stressLevel})`,
      pending: metric.pending ? 'evet' : 'hayır',
    })));
  }
}
