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
    let feedback: {
        overallScore?: number; recommendation?: string; summary?: string;
        strengths?: string[]; concerns?: string[]; communicationScore?: number;
        technicalScore?: number; cultureScore?: number; nextSteps?: string;
    } | null = null

    try {
        if (application.interview?.aiFeedback) feedback = JSON.parse(application.interview.aiFeedback)
    } catch { }

    const recColor: Record<string, string> = {
        STRONG_HIRE: 'var(--green)', HIRE: 'var(--accent)',
        MAYBE: 'var(--accent2)', NO_HIRE: 'var(--red)',
    }

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

                {/* AI Feedback */}
                {feedback && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">AI FEEDBACK</div>
                        <div className="ai-rec" style={{ color: recColor[feedback.recommendation ?? ''] ?? 'var(--text)' }}>
                            {feedback.recommendation?.replace('_', ' ')}
                        </div>
                        <div className="scores-row">
                            {[
                                { label: 'OVERALL', val: feedback.overallScore },
                                { label: 'COMMUNICATION', val: feedback.communicationScore },
                                { label: 'TECHNICAL', val: feedback.technicalScore },
                                { label: 'CULTURE', val: feedback.cultureScore },
                            ].map(({ label, val }) => (
                                <div key={label} className="score-box">
                                    <div className="sb-label font-mono">{label}</div>
                                    <div className="sb-val">{val}/10</div>
                                </div>
                            ))}
                        </div>
                        {feedback.summary && <p className="fb-summary">{feedback.summary}</p>}
                        {feedback.strengths && (
                            <div className="fb-list">
                                <div className="fb-list-label font-mono">STRENGTHS</div>
                                {feedback.strengths.map((s, i) => <div key={i} className="fb-item strength-item">✓ {s}</div>)}
                            </div>
                        )}
                        {feedback.concerns && feedback.concerns.length > 0 && (
                            <div className="fb-list">
                                <div className="fb-list-label font-mono">CONCERNS</div>
                                {feedback.concerns.map((c, i) => <div key={i} className="fb-item concern-item">→ {c}</div>)}
                            </div>
                        )}
                        {feedback.nextSteps && (
                            <div className="fb-list">
                                <div className="fb-list-label font-mono">NEXT STEPS</div>
                                <div className="fb-item">{feedback.nextSteps}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Interview Transcript */}
                {transcript && transcript.length > 0 && (
                    <div className="dc-section">
                        <div className="dc-title font-mono">
                            INTERVIEW TRANSCRIPT
                            {application.interview?.duration && (
                                <span style={{ marginLeft: 12, color: 'var(--muted)', fontWeight: 400 }}>
                                    {Math.floor(application.interview.duration / 60)}m {application.interview.duration % 60}s
                                </span>
                            )}
                        </div>
                        <div className="transcript-full">
                            {transcript.map((msg, i) => (
                                <div key={i} className={`tfull-msg tfull-${msg.role}`}>
                                    <span className="tfull-role font-mono">{msg.role === 'assistant' ? 'AI' : application.user.name.split(' ')[0].toUpperCase()}</span>
                                    <span className="tfull-content">{msg.content}</span>
                                    <span className="tfull-time font-mono">
                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </span>
                                </div>
                            ))}
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
        .ai-rec { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 20px; }
        .scores-row { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
        .score-box { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 12px 20px; text-align: center; }
        .sb-label { font-size: 9px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 6px; }
        .sb-val { font-size: 22px; font-weight: 800; color: var(--accent); }
        .fb-summary { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .fb-list { margin-bottom: 16px; }
        .fb-list-label { font-size: 10px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 8px; }
        .fb-item { font-size: 13px; padding: 7px 0; border-bottom: 1px solid var(--border); line-height: 1.5; }
        .fb-item:last-child { border-bottom: none; }
        .strength-item { color: var(--green); }
        .concern-item { color: var(--accent2); }
        .transcript-full { display: flex; flex-direction: column; gap: 0; }
        .tfull-msg { display: grid; grid-template-columns: 60px 1fr 70px; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); align-items: start; }
        .tfull-msg:last-child { border-bottom: none; }
        .tfull-role { font-size: 10px; letter-spacing: 1px; padding-top: 2px; }
        .tfull-assistant .tfull-role { color: var(--accent); }
        .tfull-user .tfull-role { color: var(--blue); }
        .tfull-content { font-size: 14px; line-height: 1.6; color: var(--text); }
        .tfull-time { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; text-align: right; padding-top: 2px; }
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
