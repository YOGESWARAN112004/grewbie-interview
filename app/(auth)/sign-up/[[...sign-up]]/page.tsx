import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="badge">
            <span className="badge-dot" />
            Join The Team
          </div>
          <h1>Create your<br /><span style={{ color: 'var(--accent)' }}>account.</span></h1>
          <p style={{ color: 'var(--muted)', marginTop: '12px', fontSize: '15px' }}>
            Sign up to start your AI-powered interview.
          </p>
        </div>
        <SignUp fallbackRedirectUrl="/apply" forceRedirectUrl="/apply" />
      </div>
      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 24px;
          position: relative;
          z-index: 1;
        }
        .auth-container {
          width: 100%;
          max-width: 480px;
        }
        .auth-header {
          margin-bottom: 32px;
        }
        .auth-header h1 {
          font-size: clamp(2rem, 5vw, 3rem);
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -1.5px;
          margin-top: 16px;
        }
        /* Clerk component overrides */
        .cl-rootBox { width: 100%; }
        .cl-card {
          background: var(--card) !important;
          border: 1px solid var(--border) !important;
          border-radius: 4px !important;
          box-shadow: none !important;
          color: var(--text) !important;
        }
        .cl-headerTitle, .cl-headerSubtitle { color: var(--text) !important; }
        .cl-formFieldLabel { color: var(--muted) !important; }
        .cl-formFieldInput {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
          border-radius: 2px !important;
        }
        .cl-formFieldInput:focus { border-color: var(--accent) !important; }
        .cl-formButtonPrimary {
          background: var(--accent) !important;
          color: var(--bg) !important;
          border-radius: 2px !important;
          font-family: 'Syne', sans-serif !important;
          font-weight: 800 !important;
        }
        .cl-footerActionLink { color: var(--accent) !important; }
        .cl-socialButtonsBlockButton {
          background: var(--surface) !important;
          border-color: var(--border) !important;
          color: var(--text) !important;
          border-radius: 2px !important;
        }
        .cl-dividerLine { background: var(--border) !important; }
        .cl-dividerText { color: var(--muted) !important; }
        .cl-identityPreviewText { color: var(--text) !important; }
        .cl-formFieldSuccessText { color: var(--green) !important; }
        .cl-formFieldErrorText { color: var(--red) !important; }
        .cl-alertText { color: var(--text) !important; }
        .cl-internal-b3fm6y { background: var(--card) !important; }
      `}</style>
    </div>
  )
}
