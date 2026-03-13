import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ApplicationForm from '@/components/application-form/ApplicationForm'

export default async function ApplyPage() {
    const { userId } = await auth()
    if (!userId) redirect('/sign-in')

    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: { application: true },
    })

    // If user already applied and interview not yet done, go to interview
    if (user?.application) {
        redirect('/interview')
    }

    return (
        <main style={{ position: 'relative', zIndex: 1 }}>
            <div className="apply-header">
                <div className="badge">
                    <span className="badge-dot" />
                    We&apos;re Hiring
                </div>
                <h1>
                    Build something<br />
                    <span style={{ color: 'var(--accent)' }}>that matters.</span>
                </h1>
                <p className="subhead">
                    We don&apos;t hire specialists who think in silos. We want people who own outcomes,
                    connect dots, and take initiative without being told.
                </p>
                <div className="perks">
                    <div className="perk"><span className="perk-dot" style={{ background: 'var(--accent)' }} />₹3K / month base</div>
                    <div className="perk"><span className="perk-dot" style={{ background: 'var(--accent2)' }} />Equity after tenure</div>
                    <div className="perk"><span className="perk-dot" style={{ background: 'var(--green)' }} />Stipend on merit</div>
                </div>
            </div>
            <ApplicationForm />
            <style>{`
        .apply-header {
          max-width: 760px; margin: 0 auto;
          padding: 60px 24px 0;
          position: relative; z-index: 1;
        }
        .apply-header h1 {
          font-size: clamp(2.2rem, 5vw, 3.5rem);
          font-weight: 800; line-height: 1.05;
          letter-spacing: -1.5px;
          margin: 16px 0 12px;
        }
        .subhead { color: var(--muted); font-size: 15px; line-height: 1.6; max-width: 480px; }
        .perks { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
        .perk {
          display: flex; align-items: center; gap: 7px;
          background: var(--card); border: 1px solid var(--border);
          padding: 7px 14px; border-radius: 2px; font-size: 13px;
          font-family: 'Space Mono', monospace;
        }
        .perk-dot { width: 7px; height: 7px; border-radius: 50%; }
      `}</style>
        </main>
    )
}
