export type AstronautId = 'rookie' | 'veteran' | 'senior';

export interface AstronautProfile {
  id: AstronautId;
  name: string;
  callsign: string;
  roleTR: string;
  age: number;
  experienceYears: number;
  flightsCompleted: number;
  avatarIcon: string;
  badgeColor: string;
  descriptionTR: string;
  physioSummaryTR: string;

  multipliers: {
    boneLoss: number;
    muscleLoss: number;
    cardioLoss: number;
    stressIncrease: number;
    sleepLoss: number;
    immuneLoss: number;
    recoveryRate: number;
  };

  baselineAdjustments: {
    radiationMSv: number;
    cardioIndex: number;
    sleepQuality: number;
    stressScore: number;
  };
}

export const ASTRONAUT_PROFILES: Record<AstronautId, AstronautProfile> = {
  rookie: {
    id: 'rookie',
    name: 'Teğmen Alper Yılmaz',
    callsign: 'NOVA-1',
    roleTR: 'Genç / Yeni Astronot (Uçuş Mühendisi)',
    age: 28,
    experienceYears: 1,
    flightsCompleted: 0,
    avatarIcon: '🧑‍🚀',
    badgeColor: '#38bdf8',
    descriptionTR:
      'İlk uzay uçuşu. Üstün kardiyovasküler dayanıklılık ve yüksek kemik/kas yoğunluğu. Ancak mikroyerçekimi adaptasyonunda ve kapalı alan izolasyon stresinde deneyimsizdir.',
    physioSummaryTR:
      'Kemik ve kas kaybı genç doku yenilenmesi sayesinde daha yavaştır. Ancak ilk görev kaygısı nedeniyle izolasyon stresi ve uyku düzensizlikleri daha belirgindir.',
    multipliers: {
      boneLoss: 0.75,
      muscleLoss: 0.8,
      cardioLoss: 0.85,
      stressIncrease: 1.45,
      sleepLoss: 1.35,
      immuneLoss: 0.9,
      recoveryRate: 1.25,
    },
    baselineAdjustments: {
      radiationMSv: 0.0,
      cardioIndex: 95,
      sleepQuality: 88,
      stressScore: 28,
    },
  },

  veteran: {
    id: 'veteran',
    name: 'Komutan Kaan Erdem',
    callsign: 'APOLLO-7',
    roleTR: '10 Yıllık Deneyimli Astronot (Görev Lideri)',
    age: 42,
    experienceYears: 10,
    flightsCompleted: 3,
    avatarIcon: '👨‍🚀',
    badgeColor: '#4ade80',
    descriptionTR:
      '3 başarılı orbital ISS görevini tamamlamış altın standart astronot. Mükemmel kriz yönetimi, yüksek psikolojik stres direnci ve dengeli fizyolojik tepkiler.',
    physioSummaryTR:
      'NASA HRP standart değerleriyle tam uyumlu referans profil. Egzersiz ve klinik karşı önlemlere vücudu en verimli yanıtı verir.',
    multipliers: {
      boneLoss: 1.0,
      muscleLoss: 1.0,
      cardioLoss: 1.0,
      stressIncrease: 0.9,
      sleepLoss: 0.9,
      immuneLoss: 1.0,
      recoveryRate: 1.0,
    },
    baselineAdjustments: {
      radiationMSv: 24.5,
      cardioIndex: 90,
      sleepQuality: 92,
      stressScore: 18,
    },
  },

  senior: {
    id: 'senior',
    name: 'Albay Dr. Teoman Aksoy',
    callsign: 'ORION-9',
    roleTR: 'Kıdemli / Yaşlı Astronot (Baş Bilim Subayı)',
    age: 58,
    experienceYears: 24,
    flightsCompleted: 6,
    avatarIcon: '👴‍🚀',
    badgeColor: '#facc15',
    descriptionTR:
      '24 yıllık uzay programı duayeni. Olağanüstü zihinsel dinginlik ve sıfır panik toleransı. Ancak yaşa bağlı fizyolojik kırılganlıklar ve kemik kaybı riski taşır.',
    physioSummaryTR:
      'Kemik mineral yoğunluğu (BMD) ve kas kütlesi mikroyerçekiminde yaş faktörü sebebiyle daha hızlı erir. Kariyer radyasyon birikimi yüksek sınırdadır, fakat psikolojik stres direnci en üst düzeydedir.',
    multipliers: {
      boneLoss: 1.45,
      muscleLoss: 1.35,
      cardioLoss: 1.3,
      stressIncrease: 0.5,
      sleepLoss: 0.6,
      immuneLoss: 1.4,
      recoveryRate: 0.7,
    },
    baselineAdjustments: {
      radiationMSv: 78.5,
      cardioIndex: 82,
      sleepQuality: 94,
      stressScore: 10,
    },
  },
};
