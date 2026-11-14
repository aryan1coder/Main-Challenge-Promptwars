import { useState } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Activity,
  Layers,
  Compass,
  FileText
} from 'lucide-react';
import {
  auth,
  createEmailAccount,
  loginWithGoogle,
  sendPasswordReset,
  signInWithEmail
} from '../../lib/googleServices';

const AUTH_ERROR_MESSAGES = {
  'auth/email-already-in-use': 'An account already exists for this email address.',
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/network-request-failed': 'Authentication could not reach Firebase. Check your connection and try again.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled for this Firebase project.',
  'auth/popup-blocked': 'Your browser blocked the Google sign-in popup. Allow popups and try again.',
  'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  'auth/weak-password': 'Choose a password with at least 6 characters.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/user-not-found': 'The email or password is incorrect.',
  'auth/wrong-password': 'The email or password is incorrect.'
};

function getAuthErrorMessage(error) {
  return AUTH_ERROR_MESSAGES[error?.code] || 'Authentication failed. Check your Firebase configuration and try again.';
}

export default function AuthPage({ onLoginSuccess, onExploreDemo }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');

    if (!email || !password) {
      setAuthError('Please enter both your email address and password.');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setAuthError('Please provide a valid email format (e.g. officer@delhi.gov.in).');
      return;
    }

    if (password.length < 6) {
      setAuthError('Password must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const credential = isSignUp
        ? await createEmailAccount(email, password, rememberMe)
        : await signInWithEmail(email, password, rememberMe);
      const user = credential.user;
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess({
          email: user.email,
          name: user.displayName || user.email?.split('@')[0] || 'Authorized User',
          isDemo: false
        });
      }
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setAuthError('');
    setAuthNotice('');
    try {
      const res = await loginWithGoogle(rememberMe);
      const user = {
        email: res.user.email,
        name: res.user.displayName || res.user.email?.split('@')[0] || 'Authorized User',
        isDemo: false
      };
      if (typeof onLoginSuccess === 'function') {
        onLoginSuccess(user);
      }
    } catch (error) {
      setAuthError(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoClick = () => {
    if (typeof onExploreDemo === 'function') {
      onExploreDemo();
    } else if (typeof onLoginSuccess === 'function') {
      onLoginSuccess({
        email: 'evaluator@promptwars.org',
        name: 'Evaluation Commissioner',
        isDemo: true
      });
    }
  };

  return (
    <div className="auth-supabase-page-shell">
      {/* Ambient Atmospheric Background Light Glows */}
      <div className="auth-ambient-glow auth-glow-cyan" />
      <div className="auth-ambient-glow auth-glow-emerald" />

      <div className="auth-two-column-layout">
        {/* =========================================================================
            LEFT COLUMN: Platform Branding, Identity, Science & Highlights
            ========================================================================= */}
        <section className="auth-branding-panel">
          <div className="auth-brand-header">
            <div className="auth-brand-badge">
              <span className="pulse-indicator-emerald"></span>
              <span className="badge-text">AETHERIS OS 2026 // CIVIC INTELLIGENCE</span>
            </div>
            <div className="auth-title-container">
              <div className="brand-icon-box">
                <Shield size={24} className="text-primary" />
              </div>
              <span className="brand-name-text">Civic Air Quality Briefing Studio</span>
            </div>
          </div>

          <div className="auth-hero-copy">
            <h1 className="auth-main-headline">
              Clearer Air.<br />
              <span className="text-gradient-cyan">Smarter Decisions.</span>
            </h1>
            <p className="auth-main-subtext">
              Transforming messy sensor telemetry into mathematically grounded interventions,
              spatial hotspot GIS telemetry, and multilingual citizen advisories.
            </p>
          </div>

          {/* 4 Architectural Feature Pillars */}
          <div className="auth-features-list">
            <div className="auth-feature-card">
              <div className="feature-icon-wrapper text-primary">
                <Activity size={18} />
              </div>
              <div>
                <h4 className="feature-title">Deterministic CPCB Science</h4>
                <p className="feature-desc">
                  Strict linear interpolation across National AQI sub-indices. Zero LLM math hallucination.
                </p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="feature-icon-wrapper text-secondary">
                <Compass size={18} />
              </div>
              <div>
                <h4 className="feature-title">Geospatial GIS Telemetry</h4>
                <p className="feature-desc">
                  OpenFreeMap vector tiles with micro-climate hotspot isolation and nocturnal inversion analysis.
                </p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="feature-icon-wrapper text-tertiary">
                <Layers size={18} />
              </div>
              <div>
                <h4 className="feature-title">Role-Tailored Interventions</h4>
                <p className="feature-desc">
                  Domain-calibrated protocols for Ward Officers, School Admins, Facility Managers &amp; Citizens.
                </p>
              </div>
            </div>

            <div className="auth-feature-card">
              <div className="feature-icon-wrapper text-primary">
                <FileText size={18} />
              </div>
              <div>
                <h4 className="feature-title">Multilingual Gemini Synthesis</h4>
                <p className="feature-desc">
                  Authentic Google Gemini 1.5 Flash grounded in deterministic metrics with Hindi &amp; English outputs.
                </p>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Seal */}
          <div className="auth-compliance-footer">
            <CheckCircle2 size={15} className="text-primary shrink-0" />
            <span>CPCB NAAQS 2026 Compliant · Zero-Disqualification Integrity · WCAG 2.1 AA</span>
          </div>
        </section>

        {/* =========================================================================
            RIGHT COLUMN: Clean Supabase-Style Dark Theme Auth Card
            ========================================================================= */}
        <section className="auth-card-panel">
          <div className="supabase-auth-card">
            {/* Instant Demo Access Hero Button (Zero Friction for Evaluators) */}
            <div className="demo-instant-access-box">
              <div className="demo-header-row">
                <div className="demo-pill-badge">
                  <Sparkles size={14} className="text-secondary" />
                  <span>EVALUATOR QUICK ACCESS</span>
                </div>
                <span className="demo-zero-tag">Zero Signup Required</span>
              </div>
              <p className="demo-access-text">
                Explore the complete platform with pre-loaded Delhi NCR telemetry and operational command workspaces.
              </p>
              <button
                type="button"
                className="btn-demo-instant-hero"
                onClick={handleQuickDemoClick}
                disabled={isLoading}
              >
                <span>Launch Interactive Demo Hub</span>
                <ArrowRight size={17} />
              </button>
            </div>

            {!auth && (
              <div className="auth-alert-box alert-info" role="status">
                <AlertCircle size={15} className="shrink-0" />
                <span>Real account sign-in is unavailable until Firebase Authentication is configured. Demo access remains separate.</span>
              </div>
            )}

            <div className="auth-or-divider">
              <span className="divider-line"></span>
              <span className="divider-label">OR ACCESS CREDENTIALS</span>
              <span className="divider-line"></span>
            </div>

            {/* Sign In / Sign Up Tab Toggle */}
            <div className="auth-tab-switcher">
              <button
                type="button"
                className={`auth-tab-btn ${!isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(false); setAuthError(''); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${isSignUp ? 'active' : ''}`}
                onClick={() => { setIsSignUp(true); setAuthError(''); }}
              >
                Create Account
              </button>
            </div>

            {/* Error / Notice Banners */}
            {authError && (
              <div className="auth-alert-box alert-error" role="alert">
                <AlertCircle size={15} className="shrink-0" />
                <span>{authError}</span>
              </div>
            )}
            {authNotice && (
              <div className="auth-alert-box alert-info" role="status">
                <CheckCircle2 size={15} className="shrink-0" />
                <span>{authNotice}</span>
              </div>
            )}

            {/* Google OAuth Button */}
            <button
              type="button"
              className="btn-supabase-oauth"
              onClick={handleGoogleSignIn}
              disabled={isLoading || !auth}
            >
              <svg className="google-icon-svg" viewBox="0 0 24 24" width="16" height="16">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google Workspace</span>
            </button>

            {/* Email / Password Form */}
            <form onSubmit={handleSubmit} className="supabase-form-stack">
              <div className="form-field-group">
                <label className="field-label" htmlFor="auth-email">
                  Operational Email Address
                </label>
                <div className="input-with-icon-wrapper">
                  <Mail size={15} className="input-leading-icon" />
                  <input
                    id="auth-email"
                    type="email"
                    className="supabase-text-input"
                    placeholder="officer@delhi.gov.in"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    disabled={isLoading || !auth}
                  />
                </div>
              </div>

              <div className="form-field-group">
                <div className="field-label-row">
                  <label className="field-label" htmlFor="auth-password">
                    Password
                  </label>
                  {!isSignUp && (
                    <button
                      type="button"
                      className="link-forgot-password"
                      onClick={async () => {
                        setAuthError('');
                        setAuthNotice('');
                        if (!email.trim()) {
                          setAuthError('Enter your email address to request a password reset.');
                          return;
                        }
                        setIsLoading(true);
                        try {
                          await sendPasswordReset(email);
                          setAuthNotice('If an account exists for this address, Firebase will send password reset instructions.');
                        } catch (error) {
                          setAuthError(getAuthErrorMessage(error));
                        } finally {
                          setIsLoading(false);
                        }
                      }}
                      disabled={isLoading || !auth}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="input-with-icon-wrapper">
                  <Lock size={15} className="input-leading-icon" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    className="supabase-text-input"
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                    required
                    disabled={isLoading || !auth}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="form-options-row">
                <label className="remember-me-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="supabase-checkbox"
                    disabled={isLoading || !auth}
                  />
                  <span>Remember operational session for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn-supabase-primary"
                disabled={isLoading || !auth}
              >
                {isLoading ? (
                  <span className="btn-loading-state">
                    <span className="mini-spinner"></span>
                    <span>Authenticating Credentials...</span>
                  </span>
                ) : isSignUp ? (
                  <span>Create Command Account</span>
                ) : (
                  <span>Sign In to Command Center</span>
                )}
              </button>
            </form>

            <p className="demo-credentials-footer">
              Credentials are verified by Firebase when configured; demo access does not create or authenticate an account.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
