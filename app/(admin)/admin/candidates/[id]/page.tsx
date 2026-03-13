import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function CandidateDetailPage({ params }: PageProps) {
    const { id } = await params
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!admin || admin.role !== 'ADMIN') redirect('/')

    const application = await prisma.application.findUnique({
        where: { id },
        include: { user: true, interview: true },
    })

    if (!application) notFound()

    const transcript = application.interview?.transcript as Array<{ role: string; content: string; timestamp: number }> | null
    let feedback: any = null

    try {
        if (application.interview?.aiFeedback) feedback = JSON.parse(application.interview.aiFeedback)
    } catch { }

    const recColor: Record<string, string> = {
        STRONG_HIRE: 'var(--green)', HIRE: 'var(--accent)',
        MAYBE: 'var(--accent2)', NO_HIRE: 'var(--red)',
    }

    // Score dimensions for the radar-style display
    const scoreDimensions = feedback?.scores ? [
        { label: 'TECHNICAL', val: feedback.scores.technical, icon: '⚙️' },
        { label: 'COMMUNICATION', val: feedback.scores.communication, icon: '💬' },
        { label: 'LEADERSHIP', val: feedback.scores.leadership, icon: '👑' },
        { label: 'CREATIVITY', val: feedback.scores.creativity, icon: '💡' },
        { label: 'PRESSURE', val: feedback.scores.pressureHandling, icon: '🔥' },
        { label: 'PROBLEM SOLVING', val: feedback.scores.problemSolving, icon: '🧩' },
        { label: 'CULTURE FIT', val: feedback.scores.cultureFit, icon: '🤝' },
        { label: 'AUTHENTICITY', val: feedback.scores.authenticity, icon: '🎯' },
    ] : [
        // Fallback for legacy feedback format
        { label: 'OVERALL', val: feedback?.overallScore, icon: '⭐' },
        { label: 'COMMUNICATION', val: feedback?.communicationScore, icon: '💬' },
        { label: 'TECHNICAL', val: feedback?.technicalScore, icon: '⚙️' },
        { label: 'CULTURE', val: feedback?.cultureScore, icon: '🤝' },
    ]

    const breakdownItems = feedback?.detailedBreakdown ? [
        { label: 'TECHNICAL DEPTH', key: 'technicalDepth', color: 'var(--accent)' },
        { label: 'COMMUNICATION STYLE', key: 'communicationStyle', color: 'var(--blue)' },
        { label: 'LEADERSHIP SIGNALS', key: 'leadershipSignals', color: 'var(--green)' },
        { label: 'CREATIVITY & VISION', key: 'creativityAndVision', color: 'var(--accent2)' },
        { label: 'PRESSURE RESPONSE', key: 'pressureResponse', color: 'var(--red)' },
        { label: 'PROBLEM SOLVING', key: 'problemSolvingApproach', color: '#a78bfa' },
        { label: 'AUTHENTICITY CHECK', key: 'authenticityCheck', color: '#f472b6' },
    ] : []

    return (
        <main className="detail-page">
            <div className="detail-wrapper animate-fadeUp">
                <div className="detail-header">
                    <a href="/admin" className="back-link font-mono">← All Candidates</a>
                    <h1>{application.user.name}</h1>
                    <p className="detail-email font-mono">{application.user.email}</p>
                    <div className="detail-meta">
                        <span className="font-mono">Applied: {new Date(application.createdAt).toLocaleDateString()}</span>
                        <StatusUpdater applicationId={id} currentStatus={application.status} />
                    </div>
                </div>

                {/* Profile */}
                <div className="dc-section">
                    <div className="dc-title font-mono">PROFILE</div>
                    <div className="profile-grid">
                        <div className="pf-item"><span className="pk font-mono">ROLES</span><span className="pv">{application.roles.join(', ')}</span></div>
                        <div className="pf-item"><span className="pk font-mono">COMMITMENT</span><span className="pv">{application.commitment}</span></div>
                        <div className="pf-item"><span className="pk font-mono">EXPERIENCE</span><span className="pv">{application.experience === 10 ? '10+ yrs' : `${application.experience} yr${application.experience !== 1 ? 's' : ''}`}</span></div>
                        <div className="pf-item"><span className="pk font-mono">EQUITY INTEREST</span><span className="pv">{application.equityInterest}</span></div>
                        {application.phone && <div className="pf-item"><span className="pk font-mono">PHONE</span><span className="pv">{application.phone}</span></div>}
                        {application.portfolio && <div className="pf-item"><span className="pk font-mono">PORTFOLIO</span><a href={application.portfolio} target="_blank" rel="noopener noreferrer" className="pv link">{application.portfolio}</a></div>}
                    </div>
                    <div className="traits-section">
                        <div className="pk font-mono" style={{ marginBottom: 8 }}>TRAITS</div>
                        <div className="traits-list">
                            {application.traits.map((t: string) => <span key={t} className="trait-chip">{t}</span>)}
                        </div>
                    </div>
                    <div className="pitch-section">
                        <div className="pk font-mono" style={{ marginBottom: 8 }}>MOTIVATION</div>
                        <p className="pitch-text">{application.motivation}</p>
                        {application.ownershipEg && (
                            <>
                                <div className="pk font-mono" style={{ marginTop: 16, marginBottom: 8 }}>OWNERSHIP EXAMPLE</div>
                                <p className="pitch-text">{application.ownershipEg}</p>
                            </>
                        )}
                    </div>
                </div>

                {/* Missing Feedback Banner — transcript exists but no AI analysis */}
                {transcript && transcript.length > 0 && !feedback && (
                    <div className="dc-section missing-feedback-banner">
                        <div className="dc-title font-mono" style={{ color: 'var(--accent2)' }}>⚠ TRANSCRIPT SAVED — AI ANALYSIS PENDING</div>
                        <p className="mfb-text">This interview has {transcript.length} transcript messages but no AI analysis. This can happen if the interview was interrupted or the connection dropped before feedback could be generated.</p>
                        <FeedbackButton applicationId={id} hasExisting={false} />
                    </div>
                )}

                {/* AI Feedback — Recommendation & Overall */}
                {feedback && (
                    <div className="dc-section">
                        {/* Re-analyze button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <div className="dc-title font-mono" style={{ marginBottom: 0 }}>AI VERDICT</div>
                            {transcript && transcript.length > 0 && (
                                <FeedbackButton applicationId={id} hasExisting={true} />
                            )}
                        </div>
                        {/* Recommendation + Hiring Confidence */}
                        <div className="verdict-header">
                            <div className="ai-rec" style={{ color: recColor[feedback.recommendation ?? ''] ?? 'var(--text)' }}>
                                {feedback.recommendation?.replace('_', ' ')}
                            </div>
                            {feedback.hiringConfidence != null && (
                                <div className="confidence-meter">
                                    <div className="confidence-label font-mono">HIRING CONFIDENCE</div>
                                    <div className="confidence-bar-track">
                                        <div
                                            className="confidence-bar-fill"
                                            style={{
                                                width: `${feedback.hiringConfidence}%`,
                                                background: feedback.hiringConfidence >= 70 ? 'var(--green)' : feedback.hiringConfidence >= 40 ? 'var(--accent)' : 'var(--red)'
                                            }}
                                        />
                                    </div>
                                    <div className="confidence-val font-mono">{feedback.hiringConfidence}%</div>
                                </div>
                            )}
                        </div>

                        {/* Overall Score */}
                        {feedback.overallScore && (
                            <div className="overall-score-badge">
                                <span className="osb-val">{feedback.overallScore}</span>
                                <span className="osb-max font-mono">/10</span>
                            </div>
                        )}

                        {/* Summary */}
                        {feedback.summary && <p className="fb-summary">{feedback.summary}</p>}

                        {/* Score Bars */}
                        <div className="dc-title font-mono" style={{ marginTop: 28 }}>DIMENSION SCORES</div>
                        <div className="score-bars">
                            {scoreDimensions.map(({ label, val, icon }) => (
                                <div key={label} className="score-bar-row">
                                    <div className="sbr-label font-mono">
                                        <span className="sbr-icon">{icon}</span> {label}
                                    </div>
                                    <div className="sbr-track">
                                        <div
                                            className="sbr-fill"
                                            style={{
                                                width: `${(val ?? 0) * 10}%`,
                                                background: (val ?? 0) >= 7 ? 'var(--green)' : (val ?? 0) >= 5 ? 'var(--accent)' : 'var(--red)'
                                            }}
                                        />
                                    </div>
                                    <div className="sbr-val font-mono">{val ?? '—'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Deep Analysis Breakdown */}
                {feedback?.detailedBreakdown && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">DEEP ANALYSIS</div>
                        <div className="breakdown-grid">
                            {breakdownItems.map(({ label, key, color }) => {
                                const val = feedback.detailedBreakdown[key]
                                if (!val) return null
                                return (
                                    <div key={key} className="breakdown-card">
                                        <div className="bk-label font-mono" style={{ color }}>{label}</div>
                                        <p className="bk-text">{val}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Personality Profile */}
                {feedback?.personalityProfile && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">🧠 PERSONALITY PROFILE</div>
                        <p className="personality-text">{feedback.personalityProfile}</p>
                    </div>
                )}

                {/* Strengths & Concerns */}
                {feedback && (feedback.strengths || feedback.concerns || feedback.redFlags) && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">STRENGTHS & CONCERNS</div>
                        {feedback.strengths && (
                            <div className="fb-list">
                                <div className="fb-list-label font-mono">✓ STRENGTHS</div>
                                {feedback.strengths.map((s: string, i: number) => <div key={i} className="fb-item strength-item">✓ {s}</div>)}
                            </div>
                        )}
                        {feedback.concerns && feedback.concerns.length > 0 && (
                            <div className="fb-list">
                                <div className="fb-list-label font-mono">→ CONCERNS</div>
                                {feedback.concerns.map((c: string, i: number) => <div key={i} className="fb-item concern-item">→ {c}</div>)}
                            </div>
                        )}
                        {feedback.redFlags && feedback.redFlags.length > 0 && (
                            <div className="fb-list red-flag-list">
                                <div className="fb-list-label font-mono" style={{ color: 'var(--red)' }}>⚠ RED FLAGS</div>
                                {feedback.redFlags.map((r: string, i: number) => <div key={i} className="fb-item red-flag-item">⚠ {r}</div>)}
                            </div>
                        )}
                    </div>
                )}

                {/* Key Quotes */}
                {feedback?.keyQuotes && feedback.keyQuotes.length > 0 && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">💬 KEY QUOTES</div>
                        <div className="quotes-list">
                            {feedback.keyQuotes.map((q: string, i: number) => (
                                <blockquote key={i} className="key-quote">
                                    &ldquo;{q}&rdquo;
                                </blockquote>
                            ))}
                        </div>
                    </div>
                )}

                {/* Form vs Interview Analysis */}
                {feedback?.formVsInterviewAnalysis && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">📝 FORM vs INTERVIEW ANALYSIS</div>
                        <div className="form-vs-interview">{feedback.formVsInterviewAnalysis}</div>
                    </div>
                )}

                {/* Next Steps */}
                {feedback?.nextSteps && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">📋 RECOMMENDED NEXT STEPS</div>
                        <div className="next-steps-text">{feedback.nextSteps}</div>
                    </div>
                )}

                {/* Interview Transcript — Annotated */}
                {transcript && transcript.length > 0 && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">
                            INTERVIEW TRANSCRIPT
                            {application.interview?.duration && (
                                <span style={{ marginLeft: 12, color: 'var(--muted)', fontWeight: 400 }}>
                                    {Math.floor(application.interview.duration / 60)}m {application.interview.duration % 60}s
                                </span>
                            )}
                            {feedback?.transcriptHighlights && (
                                <span style={{ marginLeft: 12, color: 'var(--muted)', fontWeight: 400, fontSize: 9, letterSpacing: 1 }}>
                                    ({feedback.transcriptHighlights.length} AI annotations)
                                </span>
                            )}
                        </div>
                        <div className="transcript-full">
                            {transcript.map((msg, i) => {
                                const highlight = feedback?.transcriptHighlights?.find((h: any) => h.messageIndex === i + 1)
                                const highlightClass = highlight ? `th-${highlight.category.replace('_', '-')}` : ''
                                return (
                                    <div key={i} className={`tfull-msg tfull-${msg.role} ${highlightClass}`}>
                                        <span className="tfull-role font-mono">{msg.role === 'assistant' ? 'AI' : application.user.name.split(' ')[0].toUpperCase()}</span>
                                        <div className="tfull-content-wrap">
                                            <span className="tfull-content">{msg.content}</span>
                                            {highlight && (
                                                <div className={`th-note th-note-${highlight.category.replace('_', '-')} font-mono`}>
                                                    {highlight.category === 'strength' ? '✓' : highlight.category === 'concern' ? '→' : highlight.category === 'red_flag' ? '⚠' : '●'} {highlight.note}
                                                </div>
                                            )}
                                        </div>
                                        <span className="tfull-time font-mono">
                                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        .detail-page { min-height: 100vh; position: relative; z-index: 1; padding: 60px 24px 100px; }
        .detail-wrapper { max-width: 860px; margin: 0 auto; }
        .back-link { font-size: 12px; color: var(--muted); text-decoration: none; letter-spacing: 1px; display: inline-block; margin-bottom: 20px; }
        .back-link:hover { color: var(--text); }
        .detail-header { margin-bottom: 36px; }
        .detail-header h1 { font-size: clamp(2rem, 5vw, 3.2rem); font-weight: 800; letter-spacing: -1.5px; margin-bottom: 4px; }
        .detail-email { font-size: 13px; color: var(--muted); margin-bottom: 16px; }
        .detail-meta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; font-size: 12px; color: var(--muted); letter-spacing: 1px; }
        .dc-section { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 28px 32px; margin-bottom: 20px; }
        .dc-title { font-size: 10px; letter-spacing: 2px; color: var(--muted); margin-bottom: 20px; font-weight: 700; }
        .profile-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
        @media (max-width: 520px) { .profile-grid { grid-template-columns: 1fr; } }
        .pf-item { display: flex; flex-direction: column; gap: 4px; }
        .pk { font-size: 10px; letter-spacing: 1px; color: var(--muted); }
        .pv { font-size: 14px; font-weight: 700; }
        .pv.link { color: var(--accent); text-decoration: none; word-break: break-all; }
        .traits-section { margin-bottom: 20px; }
        .traits-list { display: flex; flex-wrap: wrap; gap: 8px; }
        .trait-chip { background: rgba(232,255,71,0.06); border: 1px solid rgba(232,255,71,0.2); color: var(--accent); font-size: 12px; padding: 5px 12px; border-radius: 2px; }
        .pitch-section {}
        .pitch-text { font-size: 14px; color: var(--muted); line-height: 1.7; }

        /* Verdict */
        .verdict-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap; margin-bottom: 20px; }
        .ai-rec { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
        .confidence-meter { flex: 1; max-width: 280px; }
        .confidence-label { font-size: 9px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 6px; }
        .confidence-bar-track { height: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 4px; }
        .confidence-bar-fill { height: 100%; border-radius: 4px; transition: width 0.8s ease; }
        .confidence-val { font-size: 18px; font-weight: 700; color: var(--text); }
        .overall-score-badge { display: inline-flex; align-items: baseline; gap: 2px; margin-bottom: 16px; }
        .osb-val { font-size: 48px; font-weight: 800; color: var(--accent); line-height: 1; }
        .osb-max { font-size: 18px; color: var(--muted); }

        /* Score Bars */
        .score-bars { display: flex; flex-direction: column; gap: 12px; }
        .score-bar-row { display: grid; grid-template-columns: 160px 1fr 36px; gap: 12px; align-items: center; }
        @media (max-width: 520px) { .score-bar-row { grid-template-columns: 120px 1fr 30px; } }
        .sbr-label { font-size: 10px; letter-spacing: 1px; color: var(--muted); display: flex; align-items: center; gap: 6px; }
        .sbr-icon { font-size: 14px; }
        .sbr-track { height: 10px; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; overflow: hidden; }
        .sbr-fill { height: 100%; border-radius: 5px; transition: width 0.8s ease; }
        .sbr-val { font-size: 14px; font-weight: 700; color: var(--text); text-align: right; }

        /* Deep Analysis */
        .breakdown-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        .breakdown-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; padding: 18px 20px; }
        .bk-label { font-size: 10px; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 8px; }
        .bk-text { font-size: 13px; color: var(--muted); line-height: 1.7; margin: 0; }

        /* Personality */
        .personality-text { font-size: 14px; color: var(--text); line-height: 1.8; font-style: italic; margin: 0; padding: 16px 20px; background: var(--surface); border-left: 3px solid var(--accent); border-radius: 0 4px 4px 0; }

        /* Strengths & Concerns */
        .fb-summary { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .fb-list { margin-bottom: 16px; }
        .fb-list-label { font-size: 10px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 8px; }
        .fb-item { font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--border); line-height: 1.5; }
        .fb-item:last-child { border-bottom: none; }
        .strength-item { color: var(--green); }
        .concern-item { color: var(--accent2); }
        .red-flag-list { background: rgba(255,77,109,0.04); border: 1px solid rgba(255,77,109,0.15); border-radius: 4px; padding: 12px 16px; }
        .red-flag-item { color: var(--red); font-weight: 600; }

        /* Key Quotes */
        .quotes-list { display: flex; flex-direction: column; gap: 12px; }
        .key-quote { margin: 0; padding: 14px 20px; background: var(--surface); border-left: 3px solid var(--accent2); border-radius: 0 4px 4px 0; font-size: 13px; color: var(--text); line-height: 1.6; font-style: italic; }

        /* Form vs Interview */
        .form-vs-interview { font-size: 14px; color: var(--text); line-height: 1.8; padding: 16px 20px; background: var(--surface); border-left: 3px solid var(--accent2); border-radius: 0 4px 4px 0; }

        /* Next Steps */
        .next-steps-text { font-size: 14px; color: var(--text); line-height: 1.7; padding: 14px 20px; background: rgba(232,255,71,0.04); border: 1px solid rgba(232,255,71,0.15); border-radius: 4px; }

        /* Transcript */
        .transcript-full { display: flex; flex-direction: column; gap: 0; }
        .tfull-msg { display: grid; grid-template-columns: 60px 1fr 70px; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); align-items: start; position: relative; }
        .tfull-msg:last-child { border-bottom: none; }
        .tfull-role { font-size: 10px; letter-spacing: 1px; padding-top: 2px; }
        .tfull-assistant .tfull-role { color: var(--accent); }
        .tfull-user .tfull-role { color: var(--blue); }
        .tfull-content-wrap { display: flex; flex-direction: column; gap: 6px; }
        .tfull-content { font-size: 14px; line-height: 1.6; color: var(--text); }
        .tfull-time { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; text-align: right; padding-top: 2px; }
        
        /* Transcript Highlights */
        .th-strength { border-left: 3px solid var(--green); padding-left: 12px; background: rgba(77,255,145,0.02); }
        .th-concern { border-left: 3px solid var(--accent2); padding-left: 12px; background: rgba(255,200,87,0.02); }
        .th-red-flag { border-left: 3px solid var(--red); padding-left: 12px; background: rgba(255,77,109,0.04); }
        .th-notable { border-left: 3px solid var(--blue); padding-left: 12px; background: rgba(100,149,237,0.02); }
        .th-note { font-size: 11px; letter-spacing: 0.5px; line-height: 1.4; padding: 4px 8px; border-radius: 2px; margin-top: 2px; }
        .th-note-strength { color: var(--green); background: rgba(77,255,145,0.06); }
        .th-note-concern { color: var(--accent2); background: rgba(255,200,87,0.06); }
        .th-note-red-flag { color: var(--red); background: rgba(255,77,109,0.08); }
        .th-note-notable { color: var(--blue); background: rgba(100,149,237,0.06); }
      `}</style>
        </main>
    )
}

// Client component for status update
function StatusUpdater({ applicationId, currentStatus }: { applicationId: string; currentStatus: string }) {
    return (
        <form
            action={async (formData: FormData) => {
                'use server'
                const newStatus = formData.get('status') as string
                await prisma.application.update({ where: { id: applicationId }, data: { status: newStatus as 'PENDING' | 'REVIEWED' | 'ACCEPTED' | 'REJECTED' } })
            }}
        >
            <select name="status" defaultValue={currentStatus} className="status-select font-mono">
                {['PENDING', 'REVIEWED', 'ACCEPTED', 'REJECTED'].map((s) => (
                    <option key={s} value={s}>{s}</option>
                ))}
            </select>
            <button type="submit" className="btn btn-ghost" style={{ padding: '6px 14px', fontSize: '11px' }}>Update</button>
            <style>{`
        .status-select {
          background: var(--surface); border: 1px solid var(--border); color: var(--text);
          border-radius: 2px; padding: 6px 10px; font-size: 11px; letter-spacing: 1px;
          cursor: pointer; text-transform: uppercase;
        }
        .status-select:focus { outline: none; border-color: var(--accent); }
      `}</style>
        </form>
    )
}

// Client component for feedback generation/regeneration
function FeedbackButton({ applicationId, hasExisting }: { applicationId: string; hasExisting: boolean }) {
    return (
        <form
            action={async () => {
                'use server'
                const { auth } = await import('@clerk/nextjs/server')
                const { generateFeedback } = await import('@/lib/generateFeedback')

                const { userId } = await auth()
                if (!userId) return

                const admin = await prisma.user.findUnique({ where: { clerkId: userId } })
                if (!admin || admin.role !== 'ADMIN') return

                const application = await prisma.application.findUnique({
                    where: { id: applicationId },
                    include: { interview: true, user: true },
                })
                if (!application?.interview?.transcript) return

                const transcript = application.interview.transcript as Array<{ role: string; content: string }>
                if (transcript.length === 0) return

                try {
                    const aiFeedback = await generateFeedback(transcript, application.user.name, {
                        roles: application.roles,
                        commitment: application.commitment,
                        experience: application.experience,
                        traits: application.traits,
                        equityInterest: application.equityInterest,
                        motivation: application.motivation,
                        ownershipEg: application.ownershipEg,
                        phone: application.phone,
                        portfolio: application.portfolio,
                    })

                    await prisma.interview.update({
                        where: { applicationId: application.id },
                        data: { aiFeedback, status: 'COMPLETED' },
                    })
                } catch (err) {
                    console.error('[Regenerate] Error:', err)
                }

                const { revalidatePath } = await import('next/cache')
                revalidatePath(`/admin/candidates/${applicationId}`)
            }}
        >
            <button
                type="submit"
                className={hasExisting ? 'btn btn-ghost regen-btn' : 'btn btn-primary regen-btn-primary'}
            >
                {hasExisting ? '🔄 Re-Analyze' : '🧠 Generate AI Analysis'}
            </button>
            <style>{`
        .regen-btn { padding: 5px 12px; font-size: 10px; letter-spacing: 0.5px; }
        .regen-btn-primary { padding: 12px 24px; font-size: 13px; margin-top: 12px; }
        .missing-feedback-banner { border-color: rgba(255,200,87,0.3); background: rgba(255,200,87,0.03); }
        .mfb-text { font-size: 13px; color: var(--muted); line-height: 1.6; margin-bottom: 4px; }
      `}</style>
        </form>
    )
}
