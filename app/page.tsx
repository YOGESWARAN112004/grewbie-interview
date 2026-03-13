import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="home-page">
      <div className="home-wrapper">
        {/* Header */}
        <div className="home-header animate-fadeUp">
          <div className="badge">
            <span className="badge-dot" />
            We&apos;re Hiring
          </div>
          <h1>
            Build something<br />
            <span>that matters.</span>
          </h1>
          <p className="subhead">
            We don&apos;t hire specialists who think in silos. We want people who own outcomes,
            connect dots, and take initiative without being told.
          </p>

          <div className="perks">
            <div className="perk perk-pay"><span className="perk-dot perk-dot-accent" />₹3K / month base</div>
            <div className="perk perk-stake"><span className="perk-dot perk-dot-accent2" />Equity after tenure</div>
            <div className="perk perk-growth"><span className="perk-dot perk-dot-green" />Stipend on merit</div>
          </div>
        </div>

        {/* Features */}
        <div className="features-grid animate-fadeUp">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <div className="feature-title">AI Voice Interview</div>
            <div className="feature-desc">Real-time conversation with our AI interviewer. Exactly 15 minutes.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📋</div>
            <div className="feature-title">Smart Matching</div>
            <div className="feature-desc">Questions dynamically generated from your profile by GPT-4o.</div>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <div className="feature-title">Instant Feedback</div>
            <div className="feature-desc">AI-generated feedback and hire recommendation after your interview.</div>
          </div>
        </div>

        {/* CTA */}
        <div className="cta-section animate-fadeUp">
          <Link href="/sign-up" className="btn btn-primary cta-btn">
            Apply Now →
          </Link>
          <Link href="/sign-in" className="btn btn-ghost">
            Already applied? Sign in
          </Link>
        </div>
      </div>

      <style>{`
        .home-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          padding: 60px 24px;
        }
        .home-wrapper {
          max-width: 720px;
          width: 100%;
          margin: 0 auto;
        }
        .home-header { margin-bottom: 48px; }
        h1 {
          font-size: clamp(2.6rem, 7vw, 4.5rem);
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -2px;
          margin-top: 20px;
          margin-bottom: 16px;
        }
        h1 span { color: var(--accent); }
        .subhead {
          color: var(--muted);
          font-size: 15px;
          line-height: 1.7;
          max-width: 500px;
        }
        .perks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 24px;
        }
        .perk {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--card);
          border: 1px solid var(--border);
          padding: 8px 16px;
          border-radius: 2px;
          font-size: 13px;
          font-family: 'Space Mono', monospace;
        }
        .perk-dot { width: 7px; height: 7px; border-radius: 50%; }
        .perk-dot-accent  { background: var(--accent); }
        .perk-dot-accent2 { background: var(--accent2); }
        .perk-dot-green   { background: var(--green); }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 48px;
        }
        .feature-card {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 4px;
          padding: 24px;
          transition: border-color 0.2s;
        }
        .feature-card:hover { border-color: rgba(232,255,71,0.3); }
        .feature-icon { font-size: 28px; margin-bottom: 12px; }
        .feature-title { font-weight: 700; font-size: 15px; margin-bottom: 8px; }
        .feature-desc { color: var(--muted); font-size: 13px; line-height: 1.6; }

        .cta-section {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        .cta-btn { font-size: 16px; padding: 16px 36px; }
      `}</style>
    </main>
  )
}
