'use client';

import { useState } from 'react';
import { SURVEY_QUESTIONS } from '@/lib/health/advice';
import SimulationNotice from './SimulationNotice';

export default function SurveyScreen({ onSubmit }: { onSubmit: (answers: number[]) => void }) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => SURVEY_QUESTIONS.map(() => null));
  const complete = answers.every((answer) => answer !== null);

  return <div className="health-overlay" role="dialog" aria-modal="true" aria-labelledby="survey-title">
    <section className="health-window survey-window">
      <header className="health-header">
        <div><span className="health-kicker">SAĞLIK SORGUSU / TARAMA SONRASI</span><h1 id="survey-title">Sağlık soruları</h1></div>
      </header>
      <p className="detail-copy">Tarama tamamlandı. Sistem önerilerini üretmeden önce kendini nasıl hissettiğini yanıtla.</p>
      <ol className="survey-list">
        {SURVEY_QUESTIONS.map((question, index) => <li key={question.id}>
          <strong>{question.question}</strong>
          <div className="survey-options" role="radiogroup" aria-label={question.question}>
            {question.options.map((option, value) => <button key={option} role="radio" aria-checked={answers[index] === value}
              className={answers[index] === value ? 'selected' : ''}
              onClick={() => setAnswers((current) => current.map((entry, i) => i === index ? value : entry))}>{option}</button>)}
          </div>
        </li>)}
      </ol>
      <div className="survey-actions">
        <button className="print-button" disabled={!complete} onClick={() => onSubmit(answers as number[])}>Sonuçları ve önerileri gör <span aria-hidden="true">→</span></button>
      </div>
      <SimulationNotice />
    </section>
  </div>;
}
