'use client'

import { useRouter } from 'next/navigation'
import { useFormStore } from '@/store/formStore'
import Step1Personal from './Step1Personal'
import Step2Skills from './Step2Skills'
import Step3Character from './Step3Character'
import Step4Pitch from './Step4Pitch'

const STEPS = ['You', 'Skills', 'Character', 'Pitch']

export default function ApplicationForm() {
    const { step } = useFormStore()
    const router = useRouter()

    return (
        <div className="af-wrapper">
            {/* Steps bar */}
            <div className="steps-bar">
                {STEPS.map((label, i) => {
                    const num = i + 1
                    const isActive = step === num
                    const isDone = step > num
                    return (
                        <div key={num} className="step-group">
                            <div className={`step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}>
                                <div className="step-num">
                                    {isDone ? '✓' : num}
                                </div>
                                <div className="step-label">{label}</div>
                            </div>
                            {i < STEPS.length - 1 && (
                                <div className={`step-line ${isDone ? 'done' : ''}`} />
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Form card */}
            <div className="form-card animate-fadeUp">
                {step === 1 && <Step1Personal />}
                {step === 2 && <Step2Skills />}
                {step === 3 && <Step3Character />}
                {step === 4 && <Step4Pitch onSuccess={() => router.push('/interview')} />}
            </div>

            <style>{`
        .af-wrapper { max-width: 760px; margin: 0 auto; padding: 60px 24px 100px; position: relative; z-index: 1; }
        .steps-bar {
          display: flex;
          align-items: center;
          margin-bottom: 40px;
        }
        .step-group { display: flex; align-items: center; flex: 1; }
        .step-group:last-child { flex: none; }
        .step-item {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .step-num {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 2px solid var(--border);
          display: flex; align-items: center; justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: var(--muted);
          transition: all 0.3s;
          flex-shrink: 0;
        }
        .step-label { font-size: 12px; color: var(--muted); transition: all 0.3s; white-space: nowrap; }
        .step-line { flex: 1; height: 1px; background: var(--border); margin: 0 8px; transition: background 0.3s; }
        .step-item.active .step-num { border-color: var(--accent); background: var(--accent); color: var(--bg); }
        .step-item.active .step-label { color: var(--accent); }
        .step-item.done .step-num { border-color: var(--green); background: var(--green); color: var(--bg); }
        .step-item.done .step-label { color: var(--green); }
        .step-line.done { background: var(--green); }
        .form-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 36px 32px; }
        @media (max-width: 480px) { .form-card { padding: 24px 16px; } .af-wrapper { padding: 40px 16px 60px; } }
      `}</style>
        </div>
    )
}
