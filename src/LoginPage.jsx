
import { useState } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";

import "./LoginPage.css";

export default function LoginPage({
  onLogin,
  onForgotPassword,
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    // Validate email
    if (
      !normalizedEmail ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      setError("Enter a valid email address.");
      return;
    }

    // Validate password
    if (!password) {
      setError("Enter your password.");
      return;
    }

    if (typeof onLogin !== "function") {
      setError("Login is not connected yet.");
      return;
    }

    try {
      setIsSubmitting(true);

      await onLogin({
        email: normalizedEmail,
        password,
      });

    } catch (loginError) {
      setError(
        loginError?.message ||
        "Unable to sign in. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Enter your email address first.");
      return;
    }

    if (typeof onForgotPassword !== "function") {
      setMessage(
        "Password recovery will be enabled when Firebase is connected."
      );
      return;
    }

    try {
      await onForgotPassword(normalizedEmail);

      setMessage(
        "If the account exists, password reset instructions will be sent."
      );
    } catch (resetError) {
      setError(
        resetError?.message ||
        "Unable to request a password reset."
      );
    }
  };

  return (
    <main className="energylens-login-page">

      {/* LEFT BRAND PANEL */}
      <section className="energylens-login-brand-panel">

        <div className="energylens-login-brand">
          <span className="energylens-login-logo">
            <Zap size={25} fill="currentColor" />
          </span>

          <span>EnergyLens</span>
        </div>

        <div className="energylens-login-brand-copy">

          <span className="energylens-login-eyebrow">
            ENERGY MANAGEMENT PLATFORM
          </span>

          <h1>
            Smarter energy decisions start here.
          </h1>

          <p>
            Monitor facility performance, manage energy data
            and turn operational information into meaningful
            insights.
          </p>

        </div>

        <div className="energylens-login-security-note">
          <ShieldCheck size={19} />

          <span>
            Secure access for authorised EnergyLens users
          </span>
        </div>

      </section>

      {/* RIGHT LOGIN PANEL */}
      <section className="energylens-login-form-panel">

        <div className="energylens-login-form-wrap">

          {/* MOBILE BRAND */}
          <div className="energylens-login-mobile-brand">

            <span className="energylens-login-logo">
              <Zap size={22} fill="currentColor" />
            </span>

            <strong>EnergyLens</strong>

          </div>

          <span className="energylens-login-eyebrow">
            WELCOME BACK
          </span>

          <h2>Sign in to your account</h2>

          <p className="energylens-login-subtitle">
            Enter your authorised account details to continue.
          </p>

          <form
            className="energylens-login-form"
            onSubmit={handleSubmit}
          >

            {/* EMAIL */}
            <label htmlFor="energylens-login-email">
              Email address
            </label>

            <div className="energylens-login-input-wrap">

              <Mail size={18} aria-hidden="true" />

              <input
                id="energylens-login-email"
                type="email"
                autoComplete="username"
                placeholder="name@organisation.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />

            </div>

            {/* PASSWORD HEADING */}
            <div className="energylens-login-password-heading">

              <label htmlFor="energylens-login-password">
                Password
              </label>

              <button
                type="button"
                className="energylens-login-text-button"
                onClick={handleForgotPassword}
              >
                Forgot password?
              </button>

            </div>

            {/* PASSWORD INPUT */}
            <div className="energylens-login-input-wrap">

              <LockKeyhole size={18} aria-hidden="true" />

              <input
                id="energylens-login-password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />

              <button
                type="button"
                className="energylens-login-visibility"
                onClick={() =>
                  setShowPassword((current) => !current)
                }
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>

            </div>

            {/* ERROR MESSAGE */}
            {error && (
              <p
                className="energylens-login-alert error"
                role="alert"
              >
                {error}
              </p>
            )}

            {/* SUCCESS MESSAGE */}
            {message && (
              <p
                className="energylens-login-alert success"
                role="status"
              >
                {message}
              </p>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              className="energylens-login-submit"
              disabled={isSubmitting}
            >

              {isSubmitting ? (
                "Signing in..."
              ) : (
                <>
                  Sign In
                  <ArrowRight size={18} />
                </>
              )}

            </button>

          </form>

          {/* ACCOUNT NOTICE */}
          <div className="energylens-login-account-note">

            <ShieldCheck size={16} />

            <span>
              Accounts are created by an EnergyLens Manager.
              Contact your system administrator if you need access.
            </span>

          </div>

          <p className="energylens-login-footer">
            © {new Date().getFullYear()} EnergyLens.
            Authorised access only.
          </p>

        </div>

      </section>

    </main>
  );
}
