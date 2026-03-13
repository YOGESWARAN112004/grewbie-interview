'use client'

import { useFormStore } from '@/store/formStore'

const ROLES = [
    { id: 'copywriting', name: 'Copywriting', track: 'marketing' },
    { id: 'scriptwriting', name: 'Scriptwriting', track: 'marketing' },
    { id: 'sales', name: 'Sales', track: 'marketing' },
    { id: 'content_marketing', name: 'Content Marketing', track: 'marketing' },
    { id: 'video_editing', name: 'Video Editing', track: 'marketing' },
    { id: 'agent_engineering', name: 'Agent Engineering', track: 'engineering' },
    { id: 'deep_learning', name: 'Deep Learning', track: 'engineering' },
    { id: 'fullstack', name: 'Full Stack', track: 'engineering' },
    { id: 'devops', name: 'DevOps', track: 'engineering' },
]

const COMMITMENTS = ['Full-time', 'Part-time', 'Freelance / Project']

const trackColors: Record<string, string> = {
    marketing: 'var(--accent2)',
    engineering: 'var(--blue)',
}

export default function Step2Skills() {
    const { roles, commitment, experience, toggleRole, setField, nextStep, prevStep } = useFormStore()

    const canProceed = roles.length >= 2 && commitment

    const expLabel = experience === 10 ? '10+ yrs' : `${experience} yr${experience !== 1 ? 's' : ''}`

    const roleHint =
        roles.length === 0 ? 'Pick 2 or 3 skills you genuinely own.' :
            roles.length === 1 ? 'Pick one more — we want multi-skilled people.' :
                roles.length === 2 ? '✓ Great. Add one more if it fits.' : '✓ Perfect combo.'

    return (
        <div>
            <div className="section-title">Your skill stack</div>
            <p className="section-sub">Pick 2–3 things you can actually do. We want generalists who go deep.</p>

            <div className="track-legend">
                <div className="track-legend-item">
                    <div className="track-dot" style={{ background: 'var(--accent2)' }} /> Marketing
                </div>
                <div className="track-legend-item">
                    <div className="track-dot" style={{ background: 'var(--blue)' }} /> Engineering
                </div>
            </div>

            <div className="role-grid">
                {ROLES.map((r) => {
                    const selected = roles.includes(r.id)
                    const disabled = !selected && roles.length >= 3
                    return (
                        <div
                            key={r.id}
                            className={`role-card ${selected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
                            onClick={() => !disabled && toggleRole(r.id)}
                        >
                            <div className="role-check">✓</div>
                            <div className="role-name">{r.name}</div>
                            <div className="role-track" style={{ color: trackColors[r.track] }}>{r.track}</div>
                        </div>
                    )
                })}
            </div>
            <div className={`hint ${roles.length >= 2 ? 'ok' : roles.length === 1 ? 'warn' : ''}`}>{roleHint}</div>

            {/* Commitment */}
            <div className="field" style={{ marginTop: 24 }}>
                <label className="label">Commitment <span className="req">*</span></label>
                <div className="radio-group">
                    {COMMITMENTS.map((c) => (
                        <div
                            key={c}
                            className={`radio-btn ${commitment === c ? 'selected' : ''}`}
                            onClick={() => setField('commitment', c)}
                        >
                            {c}
                        </div>
                    ))}
                </div>
            </div>

            {/* Experience slider */}
            <div className="field">
                <label className="label">Years of relevant experience</label>
                <input
                    type="range" min={0} max={10} step={1} value={experience}
                    onChange={(e) => setField('experience', Number(e.target.value))}
                    className="exp-slider"
                />
                <div className="slider-labels">
                    <span>Fresher</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{expLabel}</span>
                    <span>10+ yrs</span>
                </div>
            </div>

            <div className="btn-row">
                <button className="btn btn-ghost" onClick={prevStep}>← Back</button>
                <button className="btn btn-primary" onClick={nextStep} disabled={!canProceed}>
                    Next: Character →
                </button>
            </div>

            <style>{`
        .section-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .section-sub { font-size: 13px; color: var(--muted); margin-bottom: 20px; }
        .track-legend { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
        .track-legend-item { display: flex; align-items: center; gap: 6px; font-size: 12px; font-family: 'Space Mono', monospace; }
        .track-dot { width: 8px; height: 8px; border-radius: 50%; }
        .role-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 10px; margin-bottom: 6px; }
        .role-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 3px;
          padding: 14px 16px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          user-select: none;
        }
        .role-card:hover:not(.disabled) { border-color: rgba(232,255,71,0.4); }
        .role-card.selected { border-color: var(--accent); background: rgba(232,255,71,0.06); }
        .role-card.disabled { opacity: 0.35; cursor: not-allowed; }
        .role-check {
          position: absolute; top: 8px; right: 10px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; color: var(--bg);
          opacity: 0; transition: opacity 0.2s;
        }
        .role-card.selected .role-check { opacity: 1; }
        .role-name { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
        .role-track { font-size: 10px; font-family: 'Space Mono', monospace; letter-spacing: 1px; text-transform: uppercase; }
        .hint { font-size: 12px; color: var(--muted); font-family: 'Space Mono', monospace; margin-top: 6px; }
        .hint.warn { color: var(--accent2); }
        .hint.ok { color: var(--green); }
        .field { margin-bottom: 22px; }
        .req { color: var(--accent2); }
        .radio-group { display: flex; flex-wrap: wrap; gap: 10px; }
        .radio-btn {
          background: var(--surface); border: 1px solid var(--border); border-radius: 2px;
          padding: 10px 18px; cursor: pointer; font-size: 13px; font-weight: 700;
          transition: all 0.2s; user-select: none;
        }
        .radio-btn:hover { border-color: rgba(232,255,71,0.4); }
        .radio-btn.selected { border-color: var(--accent); color: var(--accent); background: rgba(232,255,71,0.06); }
        .exp-slider {
          -webkit-appearance: none; width: 100%; height: 3px;
          background: var(--border); border: none; outline: none; border-radius: 2px; padding: 0;
        }
        .exp-slider::-webkit-slider-thumb {
          -webkit-appearance: none; width: 18px; height: 18px;
          border-radius: 50%; background: var(--accent); cursor: pointer;
        }
        .slider-labels { display: flex; justify-content: space-between; font-size: 11px; color: var(--muted); font-family: 'Space Mono', monospace; margin-top: 8px; }
        .btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
      `}</style>
        </div>
    )
}
