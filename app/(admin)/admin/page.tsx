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

                                        return (
                                            <div className="summary-row">
                                                <div className="summary-content">
                                                    <div className="summary-section">
                                                        <span className="summary-label font-mono" style={{ color: recColor[feedback.recommendation ?? 'MAYBE'] }}>
                                                            {feedback.recommendation?.replace('_', ' ') ?? 'NO RECOMMENDATION'}
                                                        </span>
                                                        <p className="summary-text">{feedback.summary}</p>
                                                    </div>
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
            padding: 16px 24px 24px 24px;
            background: rgba(255, 255, 255, 0.01);
            border-bottom: 1px solid var(--border);
        }
        .summary-row:last-child { border-bottom: none; }
        .summary-content {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 16px;
        }
        .summary-label {
            font-size: 11px;
            letter-spacing: 1.5px;
            font-weight: 700;
            margin-bottom: 8px;
            display: inline-block;
        }
        .summary-text {
            color: var(--muted);
            font-size: 13px;
            line-height: 1.6;
        }
      `}</style>
        </main>
    )
}
