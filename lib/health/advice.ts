import type { HealthScan, Status } from './types.ts';

export interface SurveyQuestion {
  id: string;
  question: string;
  options: [string, string, string];
  /** Cevap "Orta" veya "Kötü" ise sistemin vereceği öneri. */
  advice: string;
}

// simülasyon varsayımı: anket NASA'nın izlediği risk alanlarına göre hazırlanmış eğitim amaçlı sorulardır.
export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  { id: 'sleep', question: 'Son haftada uyku kaliteni nasıl değerlendirirsin?', options: ['İyi', 'Orta', 'Kötü'],
    advice: 'Uyku saatlerini sabitle, ışık ve gürültüyü azalt; düzenli uyku programını uygula.' },
  { id: 'vision', question: 'Baş ağrısı veya bulanık görme yaşadın mı?', options: ['Hayır', 'Ara sıra', 'Sık sık'],
    advice: 'Görme değişikliklerini uçuş doktoruna bildir; göz kontrolü planla (SANS riski).' },
  { id: 'muscle', question: 'Kaslarında yorgunluk veya güç kaybı hissediyor musun?', options: ['Hayır', 'Biraz', 'Belirgin'],
    advice: 'Direnç egzersizlerini aksatmadan sürdür; günlük egzersiz süresini artır.' },
  { id: 'mood', question: 'Ruh halin ve stres düzeyin nasıl?', options: ['Rahat', 'Gergin', 'Çok yorgun'],
    advice: 'Ekiple iletişimi artır, dinlenme saati ayır; gerekirse psikolojik destek iste.' },
  { id: 'exercise', question: 'Günlük egzersiz sürene ne kadar uydun?', options: ['Tam', 'Kısmen', 'Hiç'],
    advice: 'Günde en az 2 saat egzersiz hedefine dön; kemik ve kalp sağlığı buna bağlı.' },
];

export interface AdviceItem {
  text: string;
  tone: Status;
  source: 'tarama' | 'anket';
}

/** Tarama sonucu ve anket cevaplarından sistemin söyleyeceği önerileri üretir. */
export function buildAdvice(scan: HealthScan, answers: number[] | null): AdviceItem[] {
  const items: AdviceItem[] = [];
  if (scan.flightSurgeonAlert) items.push({ text: 'Uçuş doktoruyla hemen iletişime geç.', tone: 'red', source: 'tarama' });
  for (const metric of scan.metrics) {
    if (metric.status === 'green') continue;
    items.push({ text: `${metric.name}: ${metric.cabin.advice[0] ?? 'Değeri yakından izle.'}`, tone: metric.status, source: 'tarama' });
  }
  answers?.forEach((answer, index) => {
    const question = SURVEY_QUESTIONS[index];
    if (question && answer >= 1) items.push({ text: question.advice, tone: answer >= 2 ? 'red' : 'yellow', source: 'anket' });
  });
  if (!items.length) items.push({ text: 'Tüm göstergeler iyi görünüyor; mevcut programa devam et.', tone: 'green', source: 'tarama' });
  return items;
}
