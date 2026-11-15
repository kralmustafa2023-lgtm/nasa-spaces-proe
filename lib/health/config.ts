import type { Countermeasure, MetricId, Status } from './types.ts';

// simülasyon varsayımı: her sağlık ekranında kullanılabilecek ortak açıklama.
export const SIMULATION_NOTICE = 'Bu değerler eğitim amaçlı simülasyondur, tıbbi tanı değildir.';
// simülasyon varsayımı: görev süresi varsayılanı.
export const MISSION_DAYS_DEFAULT = 180;
// simülasyon varsayımı: aylar 30 gün kabul edilir.
export const DAYS_PER_MONTH = 30;
// simülasyon varsayımı: dönüşten sonraki değerlendirme zamanı.
export const POST_RECOVERY_DAYS = 30;
// simülasyon varsayımı: rapor ve sınıflandırmada kullanılan sayısal hassasiyet.
export const VALUE_DECIMALS = 2;
// simülasyon varsayımı: bütün endeks/yüzdelerin alt sınırı.
export const INDEX_MIN = 0;
// simülasyon varsayımı: bütün endeks/yüzdelerin üst sınırı.
export const INDEX_MAX = 100;

// simülasyon varsayımı: sonuçların sabit sırası.
export const METRIC_ORDER: readonly MetricId[] = ['radiation', 'bone', 'muscle', 'sans', 'cardio', 'immune', 'sleepMood'];
// simülasyon varsayımı: en kötü durumu belirleme sıralaması.
export const STATUS_RANK: Readonly<Record<Status, number>> = { green: 0, yellow: 1, red: 2 };
// simülasyon varsayımı: Türkçe durum etiketleri.
export const STATUS_LABELS: Readonly<Record<Status, string>> = { green: 'İyi', yellow: 'Dikkat', red: 'Yüksek risk' };

// simülasyon varsayımı / NASA verisi: aşağıdaki alanlarda ayrı ayrı belirtilmiştir.
export const RADIATION = {
  dailyDoseMSv: 0.5, // simülasyon varsayımı: verilen NASA/NTRS ISS 0.2–0.5 mSv/gün aralığından seçildi.
  careerLimitMSv: 600, // NASA verisi: kullanıcı tarafından belirtilen NASA-STD-3001 kariyer limiti.
  baselineMSv: 0, // simülasyon varsayımı: önceki kariyer maruziyeti modellenmez.
  greenBelowLimitFraction: 0.10, // simülasyon varsayımı: <%10 yeşil.
  redAtLimitFraction: 0.25, // simülasyon varsayımı: >=%25 kırmızı; ara aralık sarı.
} as const;

// simülasyon varsayımı / NASA verisi: aşağıdaki alanlarda ayrı ayrı belirtilmiştir.
export const BONE = {
  monthlyLossPercent: 1.5, // NASA verisi: kullanıcının aktardığı taslak PDF değeri; PDF dosyasıyla ayrıca teyit edilmedi.
  baselineLossPercent: 0, // simülasyon varsayımı: başlangıca göre kayıp.
  greenBelowLossPercent: 2, // simülasyon varsayımı: <%2 yeşil.
  redAtLossPercent: 6, // simülasyon varsayımı: >=%6 kırmızı.
} as const;

// TODO(pdf): PDF ile teyit et — simülasyon varsayımı: kas kaybı taslak modeli.
export const MUSCLE = {
  monthlyLossPercent: 1.7, // simülasyon varsayımı: 180 günde yaklaşık %10 kayıp.
  baselineLossPercent: 0, // simülasyon varsayımı.
  greenBelowLossPercent: 3, // simülasyon varsayımı.
  redAtLossPercent: 10, // simülasyon varsayımı.
  pending: true, // simülasyon varsayımı: PDF metni eksik.
} as const;

// simülasyon varsayımı: klinik ölçüm olmayan bağışıklık endeksi.
export const IMMUNE = {
  baselineIndex: 100, // simülasyon varsayımı.
  monthlyIndexLoss: 6, // simülasyon varsayımı.
  greenAtIndex: 90, // simülasyon varsayımı.
  yellowAtIndex: 75, // simülasyon varsayımı: bunun altı kırmızı.
} as const;

// simülasyon varsayımı: uyku kalitesi ve stres için bağımsız ölçekler.
export const SLEEP_MOOD = {
  baselineQualityPercent: 90, // simülasyon varsayımı.
  monthlyQualityLoss: 5, // simülasyon varsayımı.
  greenAtQualityPercent: 80, // simülasyon varsayımı.
  yellowAtQualityPercent: 65, // simülasyon varsayımı.
  baselineStressScore: 15, // simülasyon varsayımı.
  monthlyStressIncrease: 7, // simülasyon varsayımı.
  greenBelowStressScore: 35, // simülasyon varsayımı: düşük stres.
  redAtStressScore: 60, // simülasyon varsayımı: yüksek stres.
} as const;

// TODO(pdf): PDF ile teyit et — simülasyon varsayımı: klinik SANS testi değildir.
export const SANS = {
  baselineIndex: 0, // simülasyon varsayımı.
  monthlyIndexIncrease: 2.5, // simülasyon varsayımı.
  greenBelowIndex: 10, // simülasyon varsayımı.
  redAtIndex: 25, // simülasyon varsayımı.
  pending: true, // simülasyon varsayımı.
} as const;

// TODO(pdf): PDF ile teyit et — simülasyon varsayımı: klinik kardiyovasküler ölçüm değildir.
export const CARDIO = {
  baselineIndex: 100, // simülasyon varsayımı.
  monthlyIndexLoss: 4, // simülasyon varsayımı.
  greenAtIndex: 90, // simülasyon varsayımı.
  yellowAtIndex: 80, // simülasyon varsayımı.
  pending: true, // simülasyon varsayımı.
} as const;

// simülasyon varsayımı: oranlar klinik etkinlik iddiası taşımaz.
// Her görev bir kere uygulanır; farklı görevlerin kalan etkileri çarpılarak birleştirilir.
export const COUNTERMEASURES: readonly Countermeasure[] = [
  {
    id: 'resistanceExercise',
    nameTR: 'Direnç egzersizi',
    descriptionTR: 'Simülasyonda kemik kaybını %60, kas kaybını %55 azaltır.',
    mitigation: { bone: 0.60, muscle: 0.55 }, // simülasyon varsayımı.
  },
  {
    id: 'cardioExercise',
    nameTR: 'Kardiyo egzersizi',
    descriptionTR: 'Simülasyonda kas kaybını %35, kardiyo endeksi düşüşünü %65 azaltır.',
    mitigation: { muscle: 0.35, cardio: 0.65 }, // simülasyon varsayımı.
  },
  {
    id: 'sleepRoutine',
    nameTR: 'Düzenli uyku programı',
    descriptionTR: 'Simülasyonda uyku kalitesi düşüşünü %75, bağışıklık endeksi düşüşünü %65 azaltır.',
    mitigation: { sleepMood: 0.75, immune: 0.65 }, // simülasyon varsayımı.
  },
  {
    id: 'radiationShelter',
    nameTR: 'Radyasyon sığınağı kullanımı',
    descriptionTR: 'Simülasyonda görev sırasında biriken radyasyon dozunu %50 azaltır.',
    mitigation: { radiation: 0.50 }, // simülasyon varsayımı: koruma etkinliği doğrulanmış NASA değeri değildir.
  },
  {
    id: 'crewCommunication',
    nameTR: 'Ekip içi iletişim',
    descriptionTR: 'Simülasyonda görevle artan stres miktarını %75 azaltır.',
    mitigation: { stress: 0.75 }, // simülasyon varsayımı.
  },
];

// simülasyon varsayımı: POST_RECOVERY_DAYS sonunda olumsuz değişimin toparlanan payı.
export const RECOVERY: Readonly<Record<MetricId, number>> = {
  radiation: 0, // simülasyon varsayımı: birikmiş doz geri alınmaz.
  bone: 0.25, // simülasyon varsayımı.
  muscle: 0.50, // simülasyon varsayımı.
  immune: 0.80, // simülasyon varsayımı.
  sleepMood: 0.90, // simülasyon varsayımı: uyku ve stres değişimine uygulanır.
  sans: 0.30, // TODO(pdf): PDF ile teyit et — simülasyon varsayımı.
  cardio: 0.60, // TODO(pdf): PDF ile teyit et — simülasyon varsayımı.
};
