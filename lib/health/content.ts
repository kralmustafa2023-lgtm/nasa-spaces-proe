import type { MetricCabinInfo, MetricId, SourceReference } from './types.ts';

export interface MetricContent {
  name: string;
  cabin: MetricCabinInfo;
  pending?: boolean;
}

// NASA verisi: yalnız kullanıcı tarafından verilen gerçek URL kullanılır.
export const RADIATION_SOURCE: SourceReference = {
  label: 'NASA OCHMO Radyasyon Teknik Notu',
  url: 'https://www.nasa.gov/sites/default/files/atoms/files/radiation_protection_technical_brief_ochmo.pdf',
};

// Kullanıcının aktardığı PDF içerikleri; sayısal sonuçlar simulate.ts tarafından eklenir.
export const METRIC_CONTENT: Record<MetricId, MetricContent> = {
  radiation: {
    name: 'Radyasyon',
    cabin: {
      title: 'Toplam Radyasyon Dozu',
      detail: 'Toplam Radyasyon Dozu ve kariyer limiti (600 mSv) karşılaştırması',
      nasaRiskName: 'Radyasyona Bağlı Kanser Riski',
      hazards: ['Uzay radyasyonu'],
      conditions: ['Kanser riski', 'DNA hasarı', 'Katarakt'],
      advice: ['Radyasyon sığınağını kullan', 'Radyasyon maruziyetini azalt'],
      sources: [RADIATION_SOURCE],
    },
  },
  bone: {
    name: 'Kemik Erimesi',
    cabin: {
      title: 'Kemik Kütlesi Kaybı',
      detail: 'Ağırlıksız ortamda kemikler ağırlık taşımadığı için güç kaybeder; aylık yaklaşık %1.5 kütle kaybı görülebilir.',
      nasaRiskName: 'Uzay Uçuşunun Kemikte Yarattığı Değişiklikler',
      hazards: ['Ağırlıksız ortam'],
      conditions: ['Osteoporoz', 'Kemik kırılma riski'],
      advice: ['Direnç egzersizini artır'],
      sources: [{ label: 'Taslak PDF — kaynak bağlantısı verilmedi', url: null }],
    },
  },
  muscle: {
    name: 'Kas Kaybı',
    pending: true,
    cabin: {
      title: 'Kas Kütlesi Kaybı — Taslak',
      detail: 'Azalan fiziksel yükün kas kaybına etkisi basit bir simülasyonla gösterilir. PDF içeriği eksiktir.',
      nasaRiskName: 'TODO(pdf)',
      hazards: ['Azalan mekanik yük', 'Hareketsizlik'],
      conditions: ['Kas gücünde azalma olasılığı'],
      advice: ['Direnç ve kardiyo egzersizlerini tamamla'],
      sources: [{ label: 'TODO(pdf): PDF ile teyit et', url: null }],
    },
  },
  sans: {
    name: 'Göz ve Görme',
    pending: true,
    cabin: {
      title: 'SANS Göstergesi — Taslak',
      detail: 'Göz ve görme ile ilgili olası etkiler, klinik ölçüm olmayan taslak bir endeksle temsil edilir.',
      nasaRiskName: 'TODO(pdf)',
      hazards: ['Ağırlıksız ortamda sıvı dağılımının değişmesi'],
      conditions: ['Görmede değişiklik olasılığı'],
      advice: ['Görme ile ilgili değişiklikleri görev ekibine bildir', 'Planlı göz değerlendirmelerini takip et'],
      sources: [{ label: 'TODO(pdf): PDF ile teyit et', url: null }],
    },
  },
  cardio: {
    name: 'Kardiyo',
    pending: true,
    cabin: {
      title: 'Kardiyo Endeksi — Taslak',
      detail: 'Fiziksel kondisyon değişimi, klinik ölçüm olmayan taslak bir endeksle temsil edilir.',
      nasaRiskName: 'TODO(pdf)',
      hazards: ['Azalan fiziksel aktivite'],
      conditions: ['Fiziksel dayanıklılıkta azalma olasılığı'],
      advice: ['Kardiyo egzersizini tamamla'],
      sources: [{ label: 'TODO(pdf): PDF ile teyit et', url: null }],
    },
  },
  immune: {
    name: 'Bağışıklık Endeksi (simülasyon)',
    cabin: {
      title: 'Bağışıklık Endeksi (simülasyon)',
      detail: 'Stres ve radyasyon bağışıklık sistemini zayıflatabilir; vücutta uykuda olan virüsler aktifleşebilir. Bu 0–100 endeksi klinik bir ölçüm değildir.',
      nasaRiskName: 'Değişen Bağışıklık Sistemi Tepkileri',
      hazards: ['Stres', 'Uzay radyasyonu'],
      conditions: ['Enfeksiyonlara yakalanma', 'Cilt döküntüleri'],
      advice: ['Düzenli uyku programını uygula', 'Ekip içi iletişimi sürdür'],
      sources: [{ label: 'Taslak PDF — kaynak bağlantısı verilmedi', url: null }],
    },
  },
  sleepMood: {
    name: 'Uyku ve Ruh Hali',
    cabin: {
      title: 'Uyku Kalitesi ve Stres (simülasyon)',
      detail: 'Kronik uyku kaybı ve izolasyon stresi; ekip içi iletişim azalması.',
      nasaRiskName: 'Yetersiz Uyku ve Düzensiz Programlar / Davranışsal Değişiklikler',
      hazards: ['İzolasyon', 'Düzensiz uyku programı'],
      conditions: ['Bilişsel performans düşüşü', 'Depresyon', 'Hata yapma riski'],
      advice: ['Düzenli uyku programını uygula', 'Ekip içi iletişimi sürdür'],
      sources: [{ label: 'Taslak PDF — kaynak bağlantısı verilmedi', url: null }],
    },
  },
};

// Doğrulanmamış iddialar: hiçbir MetricResult, tabletText veya rapora dahil edilmez.
export const unverifiedClaims = [
  {
    text: "Nötron radyasyonu ISS'deki toplam radyasyonun yaklaşık %30'udur",
    verified: false,
    showInUI: false,
  },
  {
    text: 'CSA CANS teknolojisi ile izlenmektedir',
    verified: false,
    showInUI: false,
  },
] as const;
