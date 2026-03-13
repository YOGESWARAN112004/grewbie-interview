import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import React from 'react'

export default async function AdminPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const admin = await prisma.user.findUnique({ where: { clerkId: userId } })
    if (!admin || admin.role !== 'ADMIN') redirect('/')

    const applications = await prisma.application.findMany({
        include: { user: true, interview: true },
        orderBy: { createdAt: 'desc' },
    })

    const statusColors: Record<string, string> = {
        PENDING: 'status-pending', REVIEWED: 'status-reviewed',
        ACCEPTED: 'status-accepted', REJECTED: 'status-rejected',
    }

    const interviewColors: Record<string, string> = {
        PENDING: 'var(--muted)', IN_PROGRESS: 'var(--accent2)',
        COMPLETED: 'var(--green)', FAILED: 'var(--red)',
    }

    return (
        <main className="admin-page">
            <div className="admin-wrapper animate-fadeUp">
                <div className="admin-header">
                    <div className="badge"><span className="badge-dot" />Admin Dashboard</div>
                    <h1>Candidates <span style={{ color: 'var(--accent)' }}>({applications.length})</span></h1>
                </div>

                {applications.length === 0 ? (
                    <div className="empty-state">No applications yet.</div>
                ) : (
                    <div className="candidates-table">
                        <div className="table-header">
                            <span>Candidate</span>
                            <span>Roles</span>
                            <span>Interview</span>
                            <span>Status</span>
                            <span>Applied</span>
                            <span></span>
                        </div>
                        {applications.map((app: any) => (
                            <React.Fragment key={app.id}>
                                <div className={`table-row ${app.interview?.status === 'COMPLETED' ? 'has-summary' : ''}`}>
                                    <div className="td-candidate">
                                        <div className="td-name">{app.user.name}</div>
                                        <div className="td-email font-mono">{app.user.email}</div>
                                    </div>
                                    <div className="td-roles">{app.roles.slice(0, 2).join(', ')}{app.roles.length > 2 ? '…' : ''}</div>
                                    <div className="td-interview" style={{ color: interviewColors[app.interview?.status ?? 'PENDING'] }}>
                                        {app.interview?.status ?? 'PENDING'}
                                    </div>
                                    <div>
                                        <span className={`status-badge ${statusColors[app.status]}`}>{app.status}</span>
                                    </div>
                                    <div className="td-date font-mono">
                                        {new Date(app.createdAt).toLocaleDateString()}
                                    </div>
                                    <div>
                                        <Link href={`/admin/candidates/${app.id}`} className="btn btn-ghost" style={{ padding: '8px 16px', fontSize: '12px' }}>
                                            View →
                                        </Link>
                                    </div>
                                </div>
                                
                                {/* Detailed Summary Row for Completed Interviews */}
                                {app.interview?.status === 'COMPLETED' && app.interview?.aiFeedback && (
                                    (() => {
                                        let feedback = null
                                        try {
                                            feedback = JSON.parse(app.interview.aiFeedback)
                                        } catch (e) { }

                                        if (!feedback) return null

                                        const recColor: Record<string, string> = {
                                            STRONG_HIRE: 'var(--green)', HIRE: 'var(--accent)',
                                            MAYBE: 'var(--accent2)', NO_HIRE: 'var(--red)',
                                        }

                                        const miniScores = feedback.scores ? [
                                            { label: 'TECH', val: feedback.scores.technical },
                                            { label: 'COMM', val: feedback.scores.communication },
                                            { label: 'LEAD', val: feedback.scores.leadership },
                                            { label: 'PRES', val: feedback.scores.pressureHandling },
                                        ] : [
                                            { label: 'TECH', val: feedback.technicalScore },
                                            { label: 'COMM', val: feedback.communicationScore },
                                            { label: 'CULT', val: feedback.cultureScore },
                                        ]

                                        const duration = app.interview.duration
                                        const durationStr = duration ? `${Math.floor(duration / 60)}m ${duration % 60}s` : null

                                        return (
                                            <div className="summary-row">
                                                <div className="summary-content">
                                                    <div className="summary-top">
                                                        <div className="summary-left">
                                                            <span className="summary-label font-mono" style={{ color: recColor[feedback.recommendation ?? 'MAYBE'] }}>
                                                                {feedback.recommendation?.replace('_', ' ') ?? 'NO RECOMMENDATION'}
                                                            </span>
                                                            {feedback.overallScore && (
                                                                <span className="summary-score font-mono">{feedback.overallScore}/10</span>
                                                            )}
                                                            {feedback.hiringConfidence != null && (
                                                                <span className="summary-confidence font-mono">{feedback.hiringConfidence}% confidence</span>
                                                            )}
                                                            {durationStr && (
                                                                <span className="summary-duration font-mono">⏱ {durationStr}</span>
                                                            )}
                                                        </div>
                                                        <div className="summary-mini-scores">
                                                            {miniScores.map(({ label, val }) => (
                                                                <div key={label} className="mini-score">
                                                                    <div className="ms-label font-mono">{label}</div>
                                                                    <div className="ms-bar-track">
                                                                        <div className="ms-bar-fill" style={{
                                                                            width: `${(val ?? 0) * 10}%`,
                                                                            background: (val ?? 0) >= 7 ? 'var(--green)' : (val ?? 0) >= 5 ? 'var(--accent)' : 'var(--red)'
                                                                        }} />
                                                                    </div>
                                                                    <div className="ms-val font-mono">{val ?? '—'}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <p className="summary-text">{feedback.summary}</p>
                                                    {feedback.keyQuotes && feedback.keyQuotes.length > 0 && (
                                                        <div className="summary-quote font-mono">&ldquo;{feedback.keyQuotes[0]}&rdquo;</div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })()
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
        .admin-page { min-height: 100vh; position: relative; z-index: 1; padding: 60px 24px 100px; }
        .admin-wrapper { max-width: 1100px; margin: 0 auto; }
        .admin-header { margin-bottom: 40px; }
        .admin-header h1 { font-size: clamp(2rem, 4vw, 3rem); font-weight: 800; letter-spacing: -1.5px; margin-top: 16px; }
        .empty-state { background: var(--card); border: 1px solid var(--border); border-radius: 4px; padding: 60px; text-align: center; color: var(--muted); font-family: 'Space Mono', monospace; }
        .candidates-table { background: var(--card); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
        .table-header, .table-row {
            display: grid;
            grid-template-columns: 2fr 1.5fr 1.2fr 1fr 1fr 80px;
            gap: 16px; padding: 14px 24px; align-items: center;
        }
        @media(max-width: 768px) {
            .table-header, .table-row { grid-template-columns: 1fr 1fr; }
            .td-roles, .td-interview, .td-date { display: none; }
        }
        .table-header { background: var(--surface); border-bottom: 1px solid var(--border); font-size: 10px; font-family: 'Space Mono', monospace; letter-spacing: 1.5px; color: var(--muted); text-transform: uppercase; }
        .table-row { border-bottom: 1px solid var(--border); transition: background 0.15s; }
        .table-row:last-child { border-bottom: none; }
        .table-row:hover { background: rgba(232, 255, 71, 0.02); }
        .td-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
        .td-email { font-size: 11px; color: var(--muted); letter-spacing: 0.5px; }
        .td-roles { font-size: 12px; color: var(--muted); }
        .td-interview { font-size: 11px; font-family: 'Space Mono', monospace; letter-spacing: 1px; }
        .td-date { font-size: 11px; color: var(--muted); }
        .status-badge { padding: 4px 10px; border-radius: 100px; font-size: 10px; font-family: 'Space Mono', monospace; letter-spacing: 0.5px; }
        .status-pending { background: rgba(255, 255, 255, 0.05); color: var(--muted); border: 1px solid rgba(255, 255, 255, 0.1); }
        .status-reviewed { background: rgba(232, 255, 71, 0.1); color: var(--accent); border: 1px solid rgba(232, 255, 71, 0.2); }
        .status-accepted { background: rgba(77, 255, 145, 0.1); color: var(--green); border: 1px solid rgba(77, 255, 145, 0.2); }
        .status-rejected { background: rgba(255, 77, 109, 0.1); color: var(--red); border: 1px solid rgba(255, 77, 109, 0.2); }
        
        .table-row.has-summary { border-bottom: none; }
        .summary-row {
            padding: 0 24px 20px 24px;
            background: rgba(255, 255, 255, 0.01);
            border-bottom: 1px solid var(--border);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-content {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 16px 20px;
        }
        .summary-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; margin-bottom: 10px; }
        .summary-left { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
        .summary-label {
            font-size: 11px;
            letter-spacing: 1.5px;
            font-weight: 700;
        }
        .summary-score { font-size: 16px; font-weight: 800; color: var(--accent); }
        .summary-confidence { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; background: rgba(255,255,255,0.04); padding: 3px 8px; border-radius: 2px; border: 1px solid var(--border); }
        .summary-duration { font-size: 10px; color: var(--muted); letter-spacing: 0.5px; }
        .summary-mini-scores { display: flex; gap: 12px; }
        .mini-score { display: flex; align-items: center; gap: 4px; }
        .ms-label { font-size: 8px; letter-spacing: 1px; color: var(--muted); width: 32px; }
        .ms-bar-track { width: 48px; height: 5px; background: var(--card); border: 1px solid var(--border); border-radius: 3px; overflow: hidden; }
        .ms-bar-fill { height: 100%; border-radius: 3px; }
        .ms-val { font-size: 10px; color: var(--text); font-weight: 700; width: 14px; text-align: right; }
        .summary-text {
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
            margin: 0;
        }
        .summary-quote { font-size: 11px; color: var(--accent2); font-style: italic; margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border); line-height: 1.5; }
        @media(max-width: 768px) { .summary-mini-scores { display: none; } }
      `}</style>
        </main>
    )
}
