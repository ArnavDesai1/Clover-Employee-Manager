import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './SignIn.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSent(false);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.data.success) {
        setSent(true);
        setMessage(res.data.message || "If an account exists with this email, you'll receive reset instructions shortly.");
        setResetLink(res.data.resetLink || null);
      } else {
        setError(res.data.error || 'Something went wrong.');
      }
    } catch (_) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="signin-container">
        <div className="signin-card">
          <div className="signin-header">
            <div className="signin-logo">
              <img src="/clover-logo.png" alt="Clover Infotech" className="signin-logo-img" />
            </div>
            <h1 className="signin-title">Check your email</h1>
            <p className="signin-subtitle">{message}</p>
          </div>
          <div className="signin-form">
            {resetLink && (
              <p className="signin-forgot-demo">
                Mail is not configured. Use this link to set a new password (for demo):
              </p>
            )}
            {resetLink && (
              <a href={resetLink} className="signin-link signin-link-block">
                Set new password
              </a>
            )}
            <Link to="/signin" className="signin-link signin-link-block">
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <div className="signin-logo">
            <img src="/clover-logo.png" alt="Clover Infotech" className="signin-logo-img" />
          </div>
          <h1 className="signin-title">Forgot password</h1>
          <p className="signin-subtitle">Enter your email and we’ll send you reset instructions.</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="signin-error">{error}</div>}

          <div className="signin-field">
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@cloverinfotech.com"
              required
              autoFocus
            />
          </div>

          <button type="submit" className="signin-submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send reset link'}
          </button>

          <Link to="/signin" className="signin-link">
            Back to Sign in
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
