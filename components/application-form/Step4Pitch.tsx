'use client'

import { useFormStore } from '@/store/formStore'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
    onSuccess: () => void
}

export default function Step4Pitch({ onSuccess }: Props) {
    const { motivation, ownershipEg, setField, prevStep, isSubmitting, setSubmitting, ...formData } = useFormStore()
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = async () => {
        if (!motivation.trim() || motivation.length < 50) {
            setError('Please write at least 50 characters. Be real.')
            return
        }
        setError('')
        setSubmitting(true)

        try {
            const res = await fetch('/api/applications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone: formData.phone,
                    portfolio: formData.portfolio,
                    roles: formData.roles,
                    commitment: formData.commitment,
                    experience: formData.experience,
                    traits: formData.traits,
                    equityInterest: formData.equityInterest,
                    motivation,
                    ownershipEg,
                }),
            })

            const data = await res.json()

            if (res.status === 409) {
                // Already applied — go straight to interview
                router.push('/interview')
                return
            }

            if (!res.ok) throw new Error(data.error || 'Submission failed')

            onSuccess()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.'
            setError(message)
        } finally {
            setSubmitting(false)
        }
    }

    const charCount = motivation.length
    const isValid = charCount >= 50

    return (
        <div>
            <div className="section-title">Your pitch</div>
            <p className="section-sub">One chance to make us stop scrolling. No fluff.</p>

            <div className="field">
                <label className="label">Why do you want to be here? <span className="req">*</span></label>
                <textarea
                    className="input-field"
                    style={{ minHeight: 120, resize: 'vertical' }}
                    value={motivation}
                    onChange={(e) => setField('motivation', e.target.value)}
                    placeholder="What pulled you here? What are you trying to build or become? Be specific."
                    maxLength={800}
                />
                <div className="char-counter" style={{ color: isValid ? 'var(--green)' : 'var(--muted)' }}>
                    {charCount} / 800 {!isValid && `— ${50 - charCount} more to go`}
                </div>
            </div>

            <div className="field">
                <label className="label">Give us one example where you took ownership of something without being asked</label>
                <textarea
                    className="input-field"
                    style={{ minHeight: 90, resize: 'vertical' }}
                    value={ownershipEg}
                    onChange={(e) => setField('ownershipEg', e.target.value)}
                    placeholder="Optional but powerful. What did you do, and what happened?"
                    maxLength={500}
                />
            </div>

            {error && <div className="error-msg">{error}</div>}

            <div className="btn-row">
                <button className="btn btn-ghost" onClick={prevStep} disabled={isSubmitting}>← Back</button>
                <button
                    className="btn btn-primary"
                    onClick={handleSubmit}
                    disabled={!isValid || isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Submit & Start Interview →'}
                </button>
            </div>

            <style>{`
        .section-title { font-size: 20px; font-weight: 700; margin-bottom: 6px; }
        .section-sub { font-size: 13px; color: var(--muted); margin-bottom: 28px; }
        .field { margin-bottom: 22px; }
        .req { color: var(--accent2); }
        .char-counter { font-size: 11px; font-family: 'Space Mono', monospace; margin-top: 6px; text-align: right; }
        .error-msg {
          background: rgba(255,77,109,0.1); border: 1px solid rgba(255,77,109,0.3);
          color: var(--red); font-size: 12px; padding: 8px 12px;
          border-radius: 2px; margin-top: 8px; font-family: 'Space Mono', monospace;
        }
        .btn-row { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; gap: 12px; }
      `}</style>
        </div>
    )
}
