'use client'

import { useFormStore } from '@/store/formStore'

const TRAITS = [
    'Ownership mindset', 'Self-starter', 'Systems thinker',
    'Fast learner', 'Honest feedback', 'Ships fast',
    'Obsessed with quality', 'Async communicator', 'Long-term thinker',
    'Builder mentality', 'Comfortable with ambiguity', 'High agency',
]

const EQUITY_OPTIONS = [
    "Yes, that's why I'm here",
    'Maybe after I prove myself',
    'No, just the pay',
]

export default function Step3Character() {
    const { traits, equityInterest, toggleTrait, setField, nextStep, prevStep } = useFormStore()

    const canProceed = traits.length >= 3 && equityInterest

    return (
        <div>
            <div className="section-title">Your character</div>
            <p className="section-sub">Skills are table stakes. This is what actually matters to us.</p>

            <div className="field">
                <label className="label">What describes you? <span className="req">*</span> (pick at least 3)</label>
                <div className="trait-grid">
                    {TRAITS.map((t) => (
                        <div
                            key={t}
                            className={`trait-pill ${traits.includes(t) ? 'selected' : ''}`}
                            onClick={() => toggleTrait(t)}
                        >
                            {t}
                        </div>
                    ))}
                </div>
                <div className="counter">{traits.length} selected</div>
            </div>

            <div className="field" style={{ marginTop: 8 }}>
                <label className="label">Are you interested in equity / stakes? <span className="req">*</span></label>
                <div className="radio-group">
                    {EQUITY_OPTIONS.map((c) => (
                        <div
                            key={c}
                            className={`radio-btn ${equityInterest === c ? 'selected' : ''}`}
                            onClick={() => setField('equityInterest', c)}
                        >
                            {c}
                        </div>
                    ))}
                </div>
            </div>

            <div className="btn-row">
                <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
                <button className="btn btn-primary" onClick={nextStep} disabled={!canProceed}>
                    Next: Your Pitch →
                </button>
            </div>

            <style>{`
        .section-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .section-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
        .field { margin-bottom: 22px; }
        .req { color: var(--accent2); }
        .trait-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
        .trait-pill {
          background: var(--surface); border: 1px solid var(--border); border-radius: 2px;
          padding: 10px 12px; cursor: pointer; font-size: 13px; transition: all 0.2s;
          user-select: none; text-align: center;
        }
        .trait-pill:hover { border-color: rgba(232,255,71,0.4); }
        .trait-pill.selected { border-color: var(--accent); color: var(--accent); background: rgba(232,255,71,0.06); }
        .counter { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--muted); margin-top: 6px; text-align: right; }
        .radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .radio-btn {
          background: var(--surface); border: 1px solid var(--border); border-radius: 2px;
          padding: 10px 18px; cursor: pointer; font-size: 13px; font-weight: 700;
          transition: all 0.2s; user-select: none;
        }
        .radio-btn:hover { border-color: rgba(232,255,71,0.4); }
        .radio-btn.selected { border-color: var(--accent); color: var(--accent); background: rgba(232,255,71,0.06); }
        .btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
      `}</style>
        </div>
    )
}
