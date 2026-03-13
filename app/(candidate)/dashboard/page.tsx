import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

export default async function DashboardPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { application: { include: { interview: true } } },
    })

    if (!user) redirect('/sign-in')
    if (!user.application) redirect('/apply')

    const app = user.application
    const interview = app.interview

    let feedback: {
        overallScore?: number; recommendation?: string; summary?: string;
        strengths?: string[]; concerns?: string[]; communicationScore?: number;
        technicalScore?: number; cultureScore?: number; nextSteps?: string;
    } | null = null

    try {
        if (interview?.aiFeedback) feedback = JSON.parse(interview.aiFeedback)
    } catch { }

    const recColor = {
        STRONG_HIRE: 'var(--green)', HIRE: 'var(--accent)',
        MAYBE: 'var(--accent2)', NO_HIRE: 'var(--red)',
    }

    return (
        <main className="db-page">
            <div className="db-wrapper animate-fadeUp">
                {/* Header */}
                <div className="db-header">
                    <div className="badge"><span className="badge-dot" />Your Dashboard</div>
                    <h1>Hey, <span>{user.name}</span></h1>
                    <p className="subhead">Here&apos;s a summary of your application and interview results.</p>
                </div>

                {/* Application Summary */}
                <div className="db-card">
                    <div className="db-card-title font-mono">APPLICATION SUMMARY</div>
                    <div className="summary-grid">
                        <div className="summary-item"><span className="sk font-mono">ROLES</span><span className="sv">{app.roles.join(', ')}</span></div>
                        <div className="summary-item"><span className="sk font-mono">COMMITMENT</span><span className="sv">{app.commitment}</span></div>
                        <div className="summary-item"><span className="sk font-mono">EXPERIENCE</span><span className="sv">{app.experience === 10 ? '10+ yrs' : `${app.experience} yr${app.experience !== 1 ? 's' : ''}`}</span></div>
                        <div className="summary-item"><span className="sk font-mono">STATUS</span>
                            <span className={`status-badge status-${app.status.toLowerCase()}`}>{app.status}</span>
                        </div>
                    </div>
                </div>

                {/* Interview Status */}
                <div className="db-card">
                    <div className="db-card-title font-mono">INTERVIEW</div>
                    {interview?.status === 'COMPLETED' ? (
                        <>
                            <div className="interview-stats">
                                <div className="stat">
                                    <span className="stat-label font-mono">DURATION</span>
                                    <span className="stat-value">{interview.duration ? `${Math.floor(interview.duration / 60)}m ${interview.duration % 60}s` : 'N/A'}</span>
                                </div>
                                <div className="stat">
                                    <span className="stat-label font-mono">COMPLETED</span>
                                    <span className="stat-value">{interview.endedAt ? new Date(interview.endedAt).toLocaleDateString() : 'N/A'}</span>
                                </div>
                            </div>

                            {/* AI Feedback */}
                            {feedback && (
                                <div className="feedback-section">
                                    <div className="feedback-rec" style={{ color: recColor[feedback.recommendation as keyof typeof recColor] ?? 'var(--text)' }}>
                                        {feedback.recommendation?.replace('_', ' ')}
                                    </div>
                                    <div className="scores-row">
                                        <div className="score-item">
                                            <div className="score-label font-mono">OVERALL</div>
                                            <div className="score-val">{feedback.overallScore}/10</div>
                                        </div>
                                        <div className="score-item">
                                            <div className="score-label font-mono">COMMUNICATION</div>
                                            <div className="score-val">{feedback.communicationScore}/10</div>
                                        </div>
                                        <div className="score-item">
                                            <div className="score-label font-mono">TECHNICAL</div>
                                            <div className="score-val">{feedback.technicalScore}/10</div>
                                        </div>
                                        <div className="score-item">
                                            <div className="score-label font-mono">CULTURE</div>
                                            <div className="score-val">{feedback.cultureScore}/10</div>
                                        </div>
                                    </div>
                                    {feedback.summary && <p className="feedback-summary">{feedback.summary}</p>}
                                    {feedback.strengths && (
                                        <div className="feedback-list">
                                            <div className="fl-label font-mono">STRENGTHS</div>
                                            {feedback.strengths.map((s, i) => <div key={i} className="fl-item strength">✓ {s}</div>)}
                                        </div>
                                    )}
                                    {feedback.concerns && feedback.concerns.length > 0 && (
                                        <div className="feedback-list">
                                            <div className="fl-label font-mono">AREAS TO IMPROVE</div>
                                            {feedback.concerns.map((c, i) => <div key={i} className="fl-item concern">→ {c}</div>)}
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    ) : interview?.status === 'IN_PROGRESS' ? (
                        <div className="interview-cta">
                            <p>Your interview is in progress.</p>
                            <Link href="/interview" className="btn btn-primary">Resume Interview →</Link>
                        </div>
                    ) : (
                        <div className="interview-cta">
                            <p>You haven&apos;t started your interview yet.</p>
                            <Link href="/interview" className="btn btn-primary">Start Interview →</Link>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
        .db-page { min-height: 100vh; position: relative; z-index: 1; padding: 60px 24px 100px; }
        .db-wrapper { max-width: 760px; margin: 0 auto; }
        .db-header { margin-bottom: 40px; }
        .db-header h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; letter-spacing: -1.5px; margin: 16px 0 8px; }
        .db-header h1 span { color: var(--accent); }
        .subhead { color: var(--muted); font-size: 15px; }
        .db-card { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 28px 32px; margin-bottom: 20px; }
        .db-card-title { font-size: 10px; letter-spacing: 2px; color: var(--muted); margin-bottom: 18px; }
        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media (max-width: 520px) { .summary-grid { grid-template-columns: 1fr; } }
        .summary-item { display: flex; flex-direction: column; gap: 4px; }
        .sk { font-size: 10px; letter-spacing: 1px; color: var(--muted); }
        .sv { font-size: 14px; font-weight: 700; }
        .interview-stats { display: flex; gap: 32px; margin-bottom: 24px; }
        .stat { display: flex; flex-direction: column; gap: 4px; }
        .stat-label { font-size: 10px; letter-spacing: 1px; color: var(--muted); }
        .stat-value { font-size: 16px; font-weight: 700; }
        .feedback-section { margin-top: 16px; }
        .feedback-rec { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 16px; }
        .scores-row { display: flex; gap: 20px; flex-wrap: wrap; margin-bottom: 20px; }
        .score-item { background: var(--surface); border: 1px solid var(--border); border-radius: 2px; padding: 12px 16px; text-align: center; }
        .score-label { font-size: 9px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 4px; }
        .score-val { font-size: 20px; font-weight: 800; color: var(--accent); }
        .feedback-summary { color: var(--muted); font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
        .feedback-list { margin-bottom: 14px; }
        .fl-label { font-size: 10px; letter-spacing: 1.5px; color: var(--muted); margin-bottom: 8px; }
        .fl-item { font-size: 13px; padding: 6px 0; border-bottom: 1px solid var(--border); }
        .fl-item:last-child { border-bottom: none; }
        .strength { color: var(--green); }
        .concern { color: var(--accent2); }
        .interview-cta { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .interview-cta p { color: var(--muted); font-size: 14px; }
      `}</style>
        </main>
    )
}
