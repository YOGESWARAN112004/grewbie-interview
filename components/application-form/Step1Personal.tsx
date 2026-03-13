'use client'

import { useFormStore } from '@/store/formStore'

export default function Step1Personal() {
    const { name, email, phone, portfolio, setField, nextStep } = useFormStore()

    const handleNext = () => {
        if (!name.trim() || !email.trim()) return
        nextStep()
    }

    return (
        <div>
            <div className="section-title">Who are you?</div>
            <p className="section-sub">The basics. Keep it real.</p>

            <div className="field-row">
                <div className="field">
                    <label className="label">Full Name <span className="req">*</span></label>
                    <input
                        className="input-field"
                        type="text"
                        value={name}
                        onChange={(e) => setField('name', e.target.value)}
                        placeholder="Your name"
                    />
                </div>
                <div className="field">
                    <label className="label">Email <span className="req">*</span></label>
                    <input
                        className="input-field"
                        type="email"
                        value={email}
                        onChange={(e) => setField('email', e.target.value)}
                        placeholder="you@email.com"
                    />
                </div>
            </div>

            <div className="field-row">
                <div className="field">
                    <label className="label">Phone</label>
                    <input
                        className="input-field"
                        type="tel"
                        value={phone}
                        onChange={(e) => setField('phone', e.target.value)}
                        placeholder="+91 XXXXX XXXXX"
                    />
                </div>
                <div className="field">
                    <label className="label">Portfolio / LinkedIn / GitHub</label>
                    <input
                        className="input-field"
                        type="url"
                        value={portfolio}
                        onChange={(e) => setField('portfolio', e.target.value)}
                        placeholder="https://"
                    />
                </div>
            </div>

            {(!name.trim() || !email.trim()) && false && (
                <div className="error-msg show">Please fill in your name and email.</div>
            )}

            <div className="btn-row">
                <span />
                <button
                    className="btn btn-primary"
                    onClick={handleNext}
                    disabled={!name.trim() || !email.trim()}
                >
                    Next: Skills →
                </button>
            </div>

            <style>{`
        .section-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .section-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
        .field { margin-bottom: 22px; }
        .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 520px) { .field-row { grid-template-columns: 1fr; } }
        .req { color: var(--accent2); margin-left: 2px; }
        .btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
        .error-msg {
          background: rgba(255,77,109,0.1);
          border: 1px solid rgba(255,77,109,0.3);
          color: var(--red);
          font-size: 12px;
          padding: 8px 12px;
          border-radius: 2px;
          margin-top: 8px;
          font-family: 'Space Mono', monospace;
        }
      `}</style>
        </div>
    )
}
