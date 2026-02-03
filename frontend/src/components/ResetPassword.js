import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/authAPI';
import './SignIn.css';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/signin', { replace: true }), 2000);
      } else {
        setError(res.data.error || 'Failed to reset password.');
      }
    } catch (_) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="signin-container">
        <div className="signin-card">
          <div className="signin-header">
            <h1 className="signin-title">Password updated</h1>
            <p className="signin-subtitle">Redirecting you to sign in...</p>
          </div>
          <div className="signin-form">
            <Link to="/signin" className="signin-link signin-link-block">
              Go to Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="signin-container">
        <div className="signin-card">
          <div className="signin-header">
            <h1 className="signin-title">Invalid or missing link</h1>
            <p className="signin-subtitle">Use the reset link from your email, or request a new one.</p>
          </div>
          <div className="signin-form">
            <Link to="/forgot-password" className="signin-link signin-link-block">Request reset link</Link>
            <Link to="/signin" className="signin-link signin-link-block">Back to Sign in</Link>
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
          <h1 className="signin-title">Set new password</h1>
          <p className="signin-subtitle">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="signin-error">{error}</div>}

          <div className="signin-field">
            <label htmlFor="reset-password">New password</label>
            <input
              id="reset-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              minLength={6}
            />
          </div>

          <div className="signin-field">
            <label htmlFor="reset-confirm">Confirm new password</label>
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              required
              minLength={6}
            />
          </div>

          <button type="submit" className="signin-submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </button>

          <Link to="/signin" className="signin-link">
            Back to Sign in
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
